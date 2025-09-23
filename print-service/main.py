import os
import uuid
import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm

# -----------------------------
# Config
# -----------------------------
PRINT_PORT = int(os.getenv("PRINT_PORT", "4004"))
FILES_DIR = os.getenv("FILES_DIR", "./files")
DB_PATH = os.getenv("PRINT_LOG_DB", "logs.db")

os.makedirs(FILES_DIR, exist_ok=True)

# -----------------------------
# App
# -----------------------------
app = FastAPI(title="Print Service", version="1.0.0")

# CORS (relajado para dev; restringe en prod)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en producción: limita dominios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir archivos estáticos (PDFs) en /files/...
app.mount("/files", StaticFiles(directory=FILES_DIR), name="files")

# -----------------------------
# DB (SQLite) para logs
# -----------------------------
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS print_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            job_id TEXT NOT NULL,
            invoice_id TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

@app.on_event("startup")
def _startup():
    init_db()

def log_print_job(job_id: str, invoice_id: str, status: str = "completed"):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO print_logs (job_id, invoice_id, status, created_at) VALUES (?, ?, ?, ?)",
        (job_id, invoice_id, status, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()

# -----------------------------
# Util: dibujar factura
# -----------------------------
def generate_invoice_pdf(invoice: Dict[str, Any], invoice_id: str) -> str:
    """
    invoice esperado:
    {
      "id": "<uuid>",
      "customer_name": "...",
      "reservation_id": "...",
      "total": <float>,
      "items": [
         {"product_id": "...", "quantity": 2, "unit_price": 1200.0, "line_total": 2400.0},
         ...
      ]
    }
    """
    pdf_filename = f"fac-{invoice_id}.pdf"
    pdf_path = os.path.join(FILES_DIR, pdf_filename)

    c = canvas.Canvas(pdf_path, pagesize=A4)
    width, height = A4

    margin = 15 * mm
    y = height - margin

    # Encabezado
    c.setFont("Helvetica-Bold", 14)
    c.drawString(margin, y, "Factura de Venta")
    y -= 10 * mm

    c.setFont("Helvetica", 10)
    c.drawString(margin, y, f"Factura ID: {invoice_id}")
    y -= 6 * mm
    c.drawString(margin, y, f"Cliente: {invoice.get('customer_name', 'N/A')}")
    y -= 6 * mm
    c.drawString(margin, y, f"Reserva Inventario: {invoice.get('reservation_id', 'N/A')}")
    y -= 6 * mm
    c.drawString(margin, y, f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    y -= 10 * mm

    # Cabecera de tabla
    c.setFont("Helvetica-Bold", 10)
    c.drawString(margin, y, "Producto")
    c.drawString(margin + 80*mm, y, "Cant.")
    c.drawString(margin + 100*mm, y, "P. Unit.")
    c.drawString(margin + 130*mm, y, "Subtotal")
    y -= 6 * mm
    c.line(margin, y, width - margin, y)
    y -= 4 * mm

    # Items
    c.setFont("Helvetica", 10)
    items: List[Dict[str, Any]] = invoice.get("items", [])
    for it in items:
        if y < 30 * mm:  # salto de página simple
            c.showPage()
            y = height - margin
            c.setFont("Helvetica-Bold", 10)
            c.drawString(margin, y, "Producto")
            c.drawString(margin + 80*mm, y, "Cant.")
            c.drawString(margin + 100*mm, y, "P. Unit.")
            c.drawString(margin + 130*mm, y, "Subtotal")
            y -= 6 * mm
            c.line(margin, y, width - margin, y)
            y -= 4 * mm
            c.setFont("Helvetica", 10)

        pid = str(it.get("product_id", ""))
        qty = int(it.get("quantity", 0))
        unit = float(it.get("unit_price", 0.0))
        line = float(it.get("line_total", qty * unit))

        c.drawString(margin, y, pid)
        c.drawRightString(margin + 95*mm, y, f"{qty}")
        c.drawRightString(margin + 125*mm, y, f"{unit:,.0f}")
        c.drawRightString(width - margin, y, f"{line:,.0f}")
        y -= 5 * mm

    # Total
    y -= 6 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawRightString(width - margin, y, f"TOTAL: {float(invoice.get('total', 0.0)):,.0f}")

    c.showPage()
    c.save()
    return pdf_filename

# -----------------------------
# Rutas
# -----------------------------
@app.get("/health")
def health():
    return {"ok": True, "service": "print", "time": datetime.utcnow().isoformat()}

@app.post("/print/factura/{invoice_id}")
def print_invoice(invoice_id: str, payload: Dict[str, Any] = Body(...)):
    """
    Espera: { "invoice": { ... } }
    """
    invoice = payload.get("invoice")
    if not invoice or not isinstance(invoice, dict):
        raise HTTPException(status_code=400, detail="Cuerpo inválido: falta 'invoice'")

    # Generar PDF
    try:
        pdf_filename = generate_invoice_pdf(invoice, invoice_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generando PDF: {e}")

    # Log
    job_id = f"print-{uuid.uuid4().hex[:8]}"
    try:
        log_print_job(job_id, invoice_id, status="completed")
    except Exception:
        pass  # no romper si falla el log

    pdf_url = f"/files/{pdf_filename}"
    return JSONResponse({"pdf_url": pdf_url, "job_id": job_id})
