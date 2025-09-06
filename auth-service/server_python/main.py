from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import bcrypt
import jwt
import os

# --- CONFIG ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ en producción: usar solo el dominio permitido
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.getenv("MONGO_URL")
SECRET_KEY = os.getenv("SECRET_KEY")
NAME_DB = os.getenv("NAME_DB")
ALGORITHM = "HS256"

client = AsyncIOMotorClient(MONGO_URL)
db = client[NAME_DB]

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# --- MODELOS ---
class UserCreate(BaseModel):
    username: str
    password: str
    role: str

class UserLogin(BaseModel):
    username: str
    password: str


# --- HELPERS ---
def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "roles": [user["role"]],
    }

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")

        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="Usuario no encontrado")

        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


# --- ENDPOINTS ---
@app.post("/auth/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"username": user.username})
    if not db_user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    if not bcrypt.checkpw(user.password.encode(), db_user["password"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = jwt.encode({"id": str(db_user["_id"])}, SECRET_KEY, algorithm=ALGORITHM)
    return {"access_token": token, "token_type": "bearer"}


@app.post("/auth/users", status_code=201)
async def create_user(new_user: UserCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Solo los administradores pueden crear usuarios")

    if await db.users.find_one({"username": new_user.username}):
        raise HTTPException(status_code=400, detail="Usuario ya existe")

    hashed = bcrypt.hashpw(new_user.password.encode(), bcrypt.gensalt())
    result = await db.users.insert_one({
        "username": new_user.username,
        "password": hashed,
        "role": new_user.role
    })

    return {
        "id": str(result.inserted_id),
        "username": new_user.username,
        "role": new_user.role
    }

@app.get("/auth/users")
async def list_users(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Solo los administradores pueden ver la lista de usuarios")

    usuarios = []
    async for u in db.users.find({}, {"password": 0}):
        usuarios.append({
            "id": str(u["_id"]),
            "username": u["username"],
            "role": u["role"]
        })

    return usuarios


@app.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return serialize_user(current_user)
