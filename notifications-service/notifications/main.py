# notifications/main.py
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import redis.asyncio as redis
from .emailer import send_mail  # ← IMPORT RELATIVO CORRECTO

ADMIN_EMAILS = [e.strip() for e in os.getenv("ADMIN_EMAILS", "").split(",") if e.strip()]

class StockAlert(BaseModel):
    product_id: str
    current_stock: int
    min_stock: int

app = FastAPI()

# Usa el host del servicio Redis en Docker, NO localhost (eso sería el contenedor).
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
r = redis.from_url(REDIS_URL)

@app.get("/health")
async def health():
    pong = await r.ping()
    return {"ok": True, "redis": pong}

@app.post("/notifications/alerta-stock")
async def alerta_stock(body: StockAlert):
    # guarda log sencillo en redis
    await r.lpush("alerts", f"{body.product_id}|{body.current_stock}|{body.min_stock}")

    if ADMIN_EMAILS:
        subject = f"⚠️ Stock bajo: {body.product_id}"
        html = f"""
        <h2>Alerta de stock</h2>
        <p>Producto: <b>{body.product_id}</b></p>
        <p>Stock actual: <b>{body.current_stock}</b></p>
        <p>Stock mínimo: <b>{body.min_stock}</b></p>
        """
        await send_mail(subject, ADMIN_EMAILS, html, text_fallback=f"Stock bajo {body.product_id}")

    return {"status": "alert_sent", "admins_notified": len(ADMIN_EMAILS)}
