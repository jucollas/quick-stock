import os
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

MONGO_URL = os.getenv("MONGO_URL")
NAME_DB = os.getenv("NAME_DB")

client = AsyncIOMotorClient(MONGO_URL)
db = client[NAME_DB]

async def create_admin():
    existing = await db.users.find_one({"username": "admin"})
    if existing:
        print("✅ Admin ya existe")
        return

    hashed = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt())
    await db.users.insert_one({
        "username": "admin",
        "password": hashed,
        "role": "admin"
    })
    print("🚀 Admin creado: usuario=admin, password=admin123")

if __name__ == "__main__":
    asyncio.run(create_admin())
