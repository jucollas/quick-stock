from datetime import datetime, timedelta, timezone
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
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))  # NUEVO


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
        # Si el token trae `exp`, PyJWT validará expiración automáticamente
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"require": ["exp", "iat"]})
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

def create_access_token(*, user_id: str, role: str) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "id": user_id,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "iss": "auth-service"  # cambia si quieres
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# --- ENDPOINTS ---
@app.post("/auth/login")
async def login(user: UserLogin):
    db_user = await db.users.find_one({"username": user.username})
    if not db_user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # Asegúrate de que db_user["password"] sea bytes en la colección
    if not bcrypt.checkpw(user.password.encode(), db_user["password"]):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    token = create_access_token(user_id=str(db_user["_id"]), role=db_user["role"])  # CAMBIO

    # (Opcional pero útil para el frontend: segundos hasta expirar)
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


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
