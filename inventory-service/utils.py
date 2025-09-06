import os
import httpx
from fastapi import HTTPException, Header

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8000")  # fallback útil

async def verify_admin(authorization: str = Header(...)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido")
    token = authorization.split(" ", 1)[1]
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"{AUTH_SERVICE_URL}/auth/me",
                                   headers={"Authorization": f"Bearer {token}"})
        if res.status_code != 200:
            raise HTTPException(status_code=401, detail="Token inválido")
        user = res.json()
        if "admin" not in user.get("roles", []):
            raise HTTPException(status_code=403, detail="Solo administradores pueden realizar esta acción")
        return user
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="No se pudo conectar con auth-service")
    
# === Nuevo: permite S2S abierto si ALLOW_S2S_OPEN=true ===
async def verify_admin_or_open(authorization: str | None = Header(default=None)):
    # Si viene token, valida normal
    if authorization:
        return await verify_admin(authorization)  # reusa el de arriba
    # Si no hay token y está habilitado el modo abierto, permite
    if ALLOW_S2S_OPEN:
        # Puedes retornar un "user" sintético si tu código lo usa
        return {"roles": ["admin"], "system": True}
    # Si no, 401
    raise HTTPException(status_code=401, detail="Autenticación requerida")

async def check_low_stock(product):
    if product["stock"] < product["min_stock"]:
        print(f"⚠️ Alerta: Producto {product['name']} bajo stock: {product['stock']}")
        # Simulación de POST a Notification Service
        try:
            async with httpx.AsyncClient() as client:
                await client.post("http://notification-service/alert", json={
                    "product_id": product["product_id"],
                    "name": product["name"],
                    "stock": product["stock"]
                })
        except Exception:
            pass






