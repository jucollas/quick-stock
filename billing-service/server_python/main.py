import os
import uuid
import decimal
import logging
from typing import List

import asyncpg
import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, ConfigDict

# ------------------------------
# Config
# ------------------------------
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "billing-db")
POSTGRES_PORT = int(os.getenv("POSTGRES_PORT", "5432"))
POSTGRES_DB   = os.getenv("POSTGRES_DB", "billing")
POSTGRES_USER = os.getenv("POSTGRES_USER", "billing")
POSTGRES_PWD  = os.getenv("POSTGRES_PASSWORD", "billing")

INVENTORY_BASE_URL = os.getenv("INVENTORY_BASE_URL", "http://inventory-service:8001/inventory")
INVENTORY_SERVICE_TOKEN = os.getenv("INVENTORY_SERVICE_TOKEN", "")  # JWT admin del auth-service

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

# ------------------------------
# Helpers
# ------------------------------
async def fetch_product_prices() -> dict[str, float]:
    """
    Trae todos los productos del inventario y retorna un map product_id -> price.
    """
    url = f"{INVENTORY_BASE_URL}/products"
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url)
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail="No se pudo consultar productos del inventario")
        data = r.json()
        # inventario devuelve {id, product_id, name, price, stock, min_stock}
        return {p["product_id"]: float(p["price"]) for p in data}

# main.py (fragmentos relevantes)
# Quitar INVENTORY_SERVICE_TOKEN por completo

async def inventory_reserve(items: List[ItemIn]) -> str:
    url = f"{INVENTORY_BASE_URL}/reserve"
    payload = {
        "request_id": f"req-{uuid.uuid4().hex[:8]}",
        "items": [{"product_id": it.product_id, "quantity": it.quantity} for it in items]
    }
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.post(url, json=payload)  # ← sin headers
        if r.status_code == 409:
            raise HTTPException(status_code=409, detail=r.json().get("detail", "Stock insuficiente"))
        if r.status_code not in (200, 201):
            raise HTTPException(status_code=502, detail="No se pudo reservar inventario")
        return r.json()["reservation_id"]

async def inventory_commit(reservation_id: str):
    url = f"{INVENTORY_BASE_URL}/commit"
    payload = {"reservation_id": reservation_id}
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(url, json=payload)  # ← sin headers

async def inventory_release(reservation_id: str):
    url = f"{INVENTORY_BASE_URL}/release"
    payload = {"reservation_id": reservation_id}
    async with httpx.AsyncClient(timeout=10) as client:
        await client.post(url, json=payload)  # ← sin headers

async def request_print(invoice_id: str):
    # Opcional: si tienes un print-service con otra API, ajusta aquí
    if not PRINT_BASE_URL:
        return
    url = f"{PRINT_BASE_URL}/facturas/{invoice_id}"
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(url)
    except Exception:
        logger.warning("No se pudo solicitar impresión de %s (se ignora).", invoice_id)

# ------------------------------
# Endpoint principal
# ------------------------------
@app.post("/billing/facturas", response_model=InvoiceOut, status_code=201)
async def crear_factura(body: InvoiceIn):
    # 1) consultar precios vigentes
    price_map = await fetch_product_prices()

    # 2) preparar items con precio
    items_out: List[ItemOut] = []
    total = decimal.Decimal("0.00")
    for it in body.items:
        if it.product_id not in price_map:
            raise HTTPException(status_code=404, detail=f"Producto {it.product_id} no existe")
        price = decimal.Decimal(str(price_map[it.product_id]))
        subtotal = price * it.quantity
        total += subtotal
        items_out.append(ItemOut(
            product_id=it.product_id,
            quantity=it.quantity,
            unit_price=float(price),
            subtotal=float(subtotal)
        ))

    # 3) reservar en inventario (si falla, 409 o 502)
    reservation_id = await inventory_reserve(body.items)

    # 4) persistir en DB (si falla, liberar reserva)
    invoice_id = str(uuid.uuid4())
    try:
        assert pool is not None
        async with pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(
                    "INSERT INTO invoices (id, customer_name, reservation_id, total) VALUES ($1, $2, $3, $4)",
                    invoice_id, body.customer_name, reservation_id, float(total)
                )
                # bulk insert items
                await conn.executemany(
                    "INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5)",
                    [(invoice_id, io.product_id, io.quantity, io.unit_price, io.subtotal) for io in items_out]
                )
    except Exception as e:
        logger.exception("Error guardando factura en DB, se libera la reserva: %s", e)
        try:
            await inventory_release(reservation_id)
        finally:
            raise HTTPException(status_code=500, detail="No se pudo guardar la factura")

    # 5) commit en inventario (opcional; en tu inventario 'commit' solo marca estado)
    if COMMIT_AFTER_CREATE:
        try:
            await inventory_commit(reservation_id)
        except Exception:
            logger.warning("Commit de inventario falló (continuamos)")

    # 6) solicitar impresión (no bloqueante)
    try:
        await request_print(invoice_id)
    except Exception:
        pass

    return InvoiceOut(
        invoice_id=invoice_id,
        reservation_id=reservation_id,
        total=float(total),
        items=items_out
    )
