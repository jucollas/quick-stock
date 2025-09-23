import os
import httpx
from fastapi import HTTPException, Header
from typing import Optional





# OJO: apunta al servicio dentro de la red Docker + prefijo /notifications
NOTIFICATION_SERVICE_BASE = os.getenv(
    "NOTIFICATION_SERVICE_BASE",
    "http://notifications_service:4005/notifications"
)


# ===== Config desde entorno =====
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8000")
ALLOW_S2S_OPEN = os.getenv("ALLOW_S2S_OPEN", "false").lower() in ("1", "true", "yes")

HTTPX_TIMEOUT = 5.0  # s

async def verify_admin(authorization: Optional[str] = Header(default=None)):
    """
    Exige Authorization: Bearer <JWT> y valida contra auth-service /auth/me.
    Debe tener rol admin.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token inválido")

    token = authorization.split(" ", 1)[1]

    try:
        async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as client:
            res = await client.get(
                f"{AUTH_SERVICE_URL}/auth/me",
                headers={"Authorization": f"Bearer {token}"},
            )
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="No se pudo conectar con auth-service")

    if res.status_code != 200:
        # 401 o lo que devuelva el servicio de auth
        try:
            data = res.json()
            msg = data.get("detail") or data.get("message") or "Token inválido"
        except Exception:
            msg = "Token inválido"
        raise HTTPException(status_code=401, detail=msg)

    user = res.json()  # esperado: {"id": "...", "username": "...", "roles": ["admin"]} o {"role": "admin"}
    roles = user.get("roles") or []
    role = user.get("role")
    is_admin = ("admin" in roles) or (role == "admin")

    if not is_admin:
        raise HTTPException(status_code=403, detail="Solo administradores pueden realizar esta acción")

    return user


async def verify_admin_or_open(authorization: Optional[str] = Header(default=None)):
    """
    - Si llega Authorization → valida admin (como verify_admin).
    - Si NO llega Authorization y ALLOW_S2S_OPEN=true → permite llamadas S2S.
    - Si NO llega Authorization y ALLOW_S2S_OPEN=false → 401.
    """
    if authorization:
        # reusar la validación de arriba pasándole el header directamente
        return await verify_admin(authorization)

    if ALLOW_S2S_OPEN:
        # Retornamos un “usuario” sintético con rol admin (útil si lo consumes en endpoints)
        return {"roles": ["admin"], "system": True}

    raise HTTPException(status_code=401, detail="Autenticación requerida")


async def check_low_stock(product: dict):
    """
    Si el stock cae por debajo de min_stock, loguea y (opcionalmente)
    notifica a Notifications Service. No debe romper el flujo.
    """
    try:
        stock = int(product.get("stock", 0))
        min_stock = int(product.get("min_stock", 0))

        if stock < min_stock:
            print(f"⚠️ Alerta: Producto {product.get('name')} bajo stock: {stock} (< {min_stock})")

            # Construye payload correcto para /notifications/alerta-stock
            payload = {
                "product_id": product.get("product_id"),
                "current_stock": stock,
                "min_stock": min_stock,
            }

            # Llama al endpoint correcto
            url = f"{NOTIFICATION_SERVICE_BASE}/alerta-stock"

            async with httpx.AsyncClient(timeout=HTTPX_TIMEOUT) as client:
                try:
                    await client.post(url, json=payload)
                except httpx.RequestError:
                    # Silencioso: no bloquea el flujo del inventario
                    pass
    except Exception:
        # Silencioso por seguridad
        pass

