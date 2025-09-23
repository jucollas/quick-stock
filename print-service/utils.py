import os
import httpx
from fastapi import HTTPException, Header

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8000")
NOTIFICATIONS_URL = os.getenv("NOTIFICATIONS_URL", "http://notifications-service:4005")

# ... verify_admin / verify_admin_or_open iguales ...

async def check_low_stock(product: dict):
    try:
        if product["stock"] < product["min_stock"]:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(f"{NOTIFICATIONS_URL}/notifications/alerta-stock", json={
                    "product_id": product["product_id"],
                    "current_stock": int(product["stock"]),
                    "min_stock": int(product["min_stock"]),
                })
    except Exception:
        # no romper el flujo si las notificaciones fallan
        pass
