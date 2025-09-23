import os
import uuid
import decimal
import logging
from typing import List, Optional

import asyncpg
import httpx
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date, timedelta, timezone

# ------------------------------
# Config
# ------------------------------
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "billing-db")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB   = os.getenv("POSTGRES_DB", "billing")
POSTGRES_USER = os.getenv("POSTGRES_USER", "billing")
POSTGRES_PWD  = os.getenv("POSTGRES_PASSWORD", "billing")

INVENTORY_BASE_URL = os.getenv("INVENTORY_BASE_URL", "http://inventory-service:8001/inventory")
PRINT_BASE_URL = os.getenv("PRINT_BASE_URL", "http://print-service:4004")
COMMIT_AFTER_CREATE = os.getenv("COMMIT_AFTER_CREATE", "true").lower() == "true"

logger = logging.getLogger("uvicorn.error")

# ------------------------------
# App & DB pool
# ------------------------------
app = FastAPI(title="Billing Service")
pool: asyncpg.Pool | None = None

@app.on_event("startup")
async def startup():
    global pool
    pool = await asyncpg.create_pool(
        user=POSTGRES_USER,
        password=POSTGRES_PWD,
        database=POSTGRES_DB,
        host=POSTGRES_HOST,
        port=POSTGRES_PORT,
        min_size=1,
        max_size=5,
    )
    logger.info("✅ Pool PostgreSQL listo")

@app.on_event("shutdown")
async def shutdown():
    global pool
    if pool:
        await pool.close()
        logger.info("🔌 Pool PostgreSQL cerrado")

# ------------------------------
# Modelos
# ------------------------------
class ItemIn(BaseModel):
    product_id: str = Field(..., min_length=1)
    quantity: int = Field(..., gt=0)

class InvoiceIn(BaseModel):
    customer_name: str = Field(..., min_length=1)
    items: List[ItemIn] = Field(..., min_items=1)

class ItemOut(BaseModel):
    product_id: str
    quantity: int
    unit_price: float
    subtotal: float
    model_config = ConfigDict(from_attributes=True)

class InvoiceOut(BaseModel):
    invoice_id: str
    reservation_id: str
    total: float
    items: List[ItemOut]
    created_at: datetime
    pdf_url: Optional[str] = None
    print_job_id: Optional[str] = None

class InvoiceRow(BaseModel):
    invoice_id: str
    customer_name: str
    total: float
    created_at: datetime

class InvoicesList(BaseModel):
    items: List[InvoiceRow]
    total: int

class DailyPoint(BaseModel):
    date: str
    total: float
    count: int
    avg_ticket: float

class SalesDailyReport(BaseModel):
    from_date: str
    to_date: str
    currency: str = "COP"
    days: List[DailyPoint]
    summary: dict

# ------------------------------
# Helpers
# ------------------------------
async def fetch_product_prices() -> dict[str, float]:
    url = f"{INVENTORY_BASE_URL}/products"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url)
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail="No se pudo consultar productos del inventario")
        data = r.json()
        return {p["product_id"]: float(p["price"]) for p in data}

async def inventory_reserve(items: List[ItemIn]) -> str:
    url = f"{INVENTORY_BASE_URL}/reserve"
    payload = {
        "request_id": f"req-{uuid.uuid4().hex[:8]}",
        "items": [{"product_id": it.product_id, "quantity": it.quantity} for it in items]
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(url, json=payload)
        if r.status_code == 409:
            raise HTTPException(status_code=409, detail=r.json().get("detail", "Stock insuficiente"))
        if r.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail="No se pudo reservar inventario")
        return r.json()["reservation_id"]

async def inventory_commit(reservation_id: str):
    url = f"{INVENTORY_BASE_URL}/commit"
    payload = {"reservation_id": reservation_id}
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(url, json=payload)

async def inventory_release(reservation_id: str):
    url = f"{INVENTORY_BASE_URL}/release"
    payload = {"reservation_id": reservation_id}
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(url, json=payload)

def build_invoice_payload(
    invoice_id: str,
    body: InvoiceIn,
    items_out: List[ItemOut],
    total: decimal.Decimal,
    reservation_id: str
) -> dict:
    return {
        "id": invoice_id,
        "customer_name": body.customer_name,
        "reservation_id": reservation_id,
        "total": float(total),
        "items": [
            {
                "product_id": io.product_id,
                "quantity": io.quantity,
                "unit_price": io.unit_price,
                "line_total": io.subtotal,
            } for io in items_out
        ]
    }

async def request_print(invoice_id: str, invoice_payload: dict) -> tuple[Optional[str], Optional[str]]:
    if not PRINT_BASE_URL:
        return (None, None)
    url = f"{PRINT_BASE_URL}/print/factura/{invoice_id}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.post(url, json={"invoice": invoice_payload})
        if r.status_code != 200:
            logger.warning("Printing devolvió %s: %s", r.status_code, r.text)
            return (None, None)
        data = r.json()
        return (data.get("pdf_url"), data.get("job_id"))
    except Exception as e:
        logger.warning("No se pudo solicitar impresión de %s: %s", invoice_id, e)
        return (None, None)

def _parse_date(d: str) -> date:
    try:
        return datetime.strptime(d, "%Y-%m-%d").date()
    except Exception:
        raise HTTPException(status_code=422, detail="Fecha inválida. Formato esperado YYYY-MM-DD")

# ------------------------------
# Crear factura
# ------------------------------
@app.post("/billing/facturas", response_model=InvoiceOut, status_code=201)
async def crear_factura(body: InvoiceIn):
    price_map = await fetch_product_prices()

    items_out: List[ItemOut] = []
    total = decimal.Decimal("0.00")
    for it in body.items:
        if it.product_id not in price_map:
            raise HTTPException(status_code=404, detail=f"Producto {it.product_id} no existe")
        price = decimal.Decimal(str(price_map[it.product_id]))
        subtotal = price * decimal.Decimal(it.quantity)
        total += subtotal
        items_out.append(ItemOut(
            product_id=it.product_id,
            quantity=it.quantity,
            unit_price=float(price),
            subtotal=float(subtotal)
        ))

    reservation_id = await inventory_reserve(body.items)

    invoice_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc)
    try:
        assert pool is not None
        async with pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(
                    """
                    INSERT INTO invoices (id, customer_name, reservation_id, total, created_at)
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    invoice_id, body.customer_name, reservation_id, float(total), created_at
                )
                await conn.executemany(
                    """
                    INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal)
                    VALUES ($1, $2, $3, $4, $5)
                    """,
                    [(invoice_id, io.product_id, io.quantity, io.unit_price, io.subtotal) for io in items_out]
                )
    except Exception as e:
        logger.exception("Error guardando factura en DB, se libera la reserva: %s", e)
        try:
            await inventory_release(reservation_id)
        finally:
            raise HTTPException(status_code=500, detail="No se pudo guardar la factura")

    if COMMIT_AFTER_CREATE:
        try:
            await inventory_commit(reservation_id)
        except Exception:
            logger.warning("Commit de inventario falló (continuamos)")

    pdf_url: Optional[str] = None
    print_job_id: Optional[str] = None
    try:
        invoice_payload = build_invoice_payload(invoice_id, body, items_out, total, reservation_id)
        pdf_url, print_job_id = await request_print(invoice_id, invoice_payload)
    except Exception:
        pass

    return InvoiceOut(
        invoice_id=invoice_id,
        reservation_id=reservation_id,
        total=float(total),
        items=items_out,
        created_at=created_at,
        pdf_url=pdf_url,
        print_job_id=print_job_id
    )

# ------------------------------
# Listado de facturas (filtros)
# ------------------------------
@app.get("/billing/facturas", response_model=InvoicesList)
async def listar_facturas(
    from_date: str = Query(..., description="YYYY-MM-DD"),
    to_date: str = Query(..., description="YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=500),
):
    f = _parse_date(from_date)
    t = _parse_date(to_date)
    if f > t:
        raise HTTPException(status_code=422, detail="from_date no puede ser mayor que to_date")
    # rango [f, t+1)
    t_next = t + timedelta(days=1)

    offset = (page - 1) * page_size

    assert pool is not None
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, customer_name, total, created_at
            FROM invoices
            WHERE created_at >= $1 AND created_at < $2
            ORDER BY created_at ASC
            LIMIT $3 OFFSET $4
            """,
            datetime(f.year, f.month, f.day, tzinfo=timezone.utc),
            datetime(t_next.year, t_next.month, t_next.day, tzinfo=timezone.utc),
            page_size, offset
        )
        total_count = await conn.fetchval(
            """
            SELECT COUNT(*) FROM invoices
            WHERE created_at >= $1 AND created_at < $2
            """,
            datetime(f.year, f.month, f.day, tzinfo=timezone.utc),
            datetime(t_next.year, t_next.month, t_next.day, tzinfo=timezone.utc),
        )

    items = [
        InvoiceRow(
            invoice_id=r["id"],
            customer_name=r["customer_name"],
            total=float(r["total"]),
            created_at=r["created_at"],
        )
        for r in rows
    ]
    return InvoicesList(items=items, total=int(total_count))

# ------------------------------
# Reporte: ventas por día
# ------------------------------
@app.get("/billing/report/ventas-diarias", response_model=SalesDailyReport)
async def reporte_ventas_diarias(
    from_date: str = Query(..., description="YYYY-MM-DD"),
    to_date: str = Query(..., description="YYYY-MM-DD"),
):
    f = _parse_date(from_date)
    t = _parse_date(to_date)
    if f > t:
        raise HTTPException(status_code=422, detail="from_date no puede ser mayor que to_date")

    # Limita rango (defensa): 366 días
    if (t - f).days > 366:
        raise HTTPException(status_code=422, detail="Rango demasiado grande (máximo 366 días)")

    t_next = t + timedelta(days=1)

    assert pool is not None
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT DATE(created_at AT TIME ZONE 'UTC') AS d,
                   SUM(total) AS total,
                   COUNT(*) AS cnt
            FROM invoices
            WHERE created_at >= $1 AND created_at < $2
            GROUP BY 1
            ORDER BY 1
            """,
            datetime(f.year, f.month, f.day, tzinfo=timezone.utc),
            datetime(t_next.year, t_next.month, t_next.day, tzinfo=timezone.utc),
        )

    days: List[DailyPoint] = []
    total_sum = decimal.Decimal("0")
    count_sum = 0

    for r in rows:
        d: date = r["d"]
        tot = decimal.Decimal(str(r["total"] or 0))
        cnt = int(r["cnt"] or 0)
        avg = float(tot / cnt) if cnt > 0 else 0.0
        total_sum += tot
        count_sum += cnt
        days.append(DailyPoint(
            date=d.isoformat(),
            total=float(tot),
            count=cnt,
            avg_ticket=float(avg)
        ))

    summary = {
        "total": float(total_sum),
        "count": count_sum,
        "avg_ticket": float(total_sum / count_sum) if count_sum > 0 else 0.0
    }

    return SalesDailyReport(
        from_date=f.isoformat(),
        to_date=t.isoformat(),
        currency="COP",
        days=days,
        summary=summary
    )
