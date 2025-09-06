from fastapi import FastAPI, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
import os
import uuid
import logging

from models import Product, ReserveRequest, ReservationAction, ProductOut
from utils import check_low_stock, verify_admin, verify_admin_or_open

app = FastAPI(title="Inventory Service")
logger = logging.getLogger("uvicorn.error")

# ========================
# Middleware CORS
# ========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ En producción: restringir al dominio permitido
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================
# Conexión a Mongo
# ========================
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("NAME_DB")

client: AsyncIOMotorClient = None
db = None

@app.on_event("startup")
async def startup_db():
    global client, db
    try:
        client = AsyncIOMotorClient(MONGO_URL, serverSelectionTimeoutMS=5000)
        # Probar conexión con ping
        await client.admin.command("ping")
        db = client[DB_NAME]
        logger.info(f"✅ Conectado a MongoDB Atlas -> Base de datos: {DB_NAME}")
    except Exception as e:
        logger.error(f"❌ Error conectando a MongoDB Atlas: {e}")
        raise HTTPException(status_code=503, detail="No se pudo conectar a la base de datos")


@app.on_event("shutdown")
async def shutdown_db():
    if client:
        client.close()
        logger.info("🔌 Conexión a MongoDB cerrada.")


# ========================
# Endpoints
# ========================

@app.post("/inventory/products", response_model=ProductOut, status_code=201)
async def create_product(product: Product, user=Depends(verify_admin)):
    if await db.products.find_one({"product_id": product.product_id}):
        raise HTTPException(status_code=400, detail="Producto ya existe")

    product_doc = product.dict()
    result = await db.products.insert_one(product_doc)

    return {"id": str(result.inserted_id), **product_doc}




@app.get("/inventory/products")
async def list_products():
    cursor = db.products.find()
    products = []
    async for p in cursor:
        p["id"] = str(p["_id"])
        del p["_id"]
        products.append(p)
    return products


@app.post("/inventory/reserve")
async def reserve_items(req: ReserveRequest, user=Depends(verify_admin_or_open)):
    reservation_id = f"res-{uuid.uuid4().hex[:6]}"
    reservation_items = []

    for item in req.items:
        product = await db.products.find_one({"product_id": item.product_id})
        if not product:
            raise HTTPException(status_code=404, detail=f"Producto {item.product_id} no existe")
        if product["stock"] < item.quantity:
            raise HTTPException(status_code=409, detail=f"Stock insuficiente para {item.product_id}")
        reservation_items.append({"product_id": item.product_id, "reserved": item.quantity})
    
    for item in reservation_items:
        await db.products.update_one(
            {"product_id": item["product_id"]},
            {"$inc": {"stock": -item["reserved"]}}
        )
        updated = await db.products.find_one({"product_id": item["product_id"]})
        await check_low_stock(updated)

    await db.reservations.insert_one({
        "reservation_id": reservation_id,
        "items": reservation_items,
        "status": "reserved"
    })
    return {"reservation_id": reservation_id, "items": reservation_items}


@app.post("/inventory/commit")
async def commit_reservation(action: ReservationAction, user=Depends(verify_admin_or_open)):
    reservation = await db.reservations.find_one({"reservation_id": action.reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    if reservation["status"] != "reserved":
        raise HTTPException(status_code=400, detail="Reserva no en estado 'reserved'")
    
    await db.reservations.update_one(
        {"reservation_id": action.reservation_id},
        {"$set": {"status": "committed"}}
    )
    return {"status": "committed"}


@app.post("/inventory/release")
async def release_reservation(action: ReservationAction, user=Depends(verify_admin_or_open)):
    reservation = await db.reservations.find_one({"reservation_id": action.reservation_id})
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    if reservation["status"] != "reserved":
        raise HTTPException(status_code=400, detail="Solo reservas 'reserved' se pueden liberar")

    for item in reservation["items"]:
        await db.products.update_one(
            {"product_id": item["product_id"]},
            {"$inc": {"stock": item["reserved"]}}
        )
    
    await db.reservations.update_one(
        {"reservation_id": action.reservation_id},
        {"$set": {"status": "released"}}
    )
    return {"status": "released"}
