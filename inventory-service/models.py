from pydantic import BaseModel
from typing import List

class Product(BaseModel):
    product_id: str
    name: str
    price: float
    stock: int
    min_stock: int

class ProductOut(BaseModel):
    id: str
    product_id: str
    name: str
    price: float
    stock: int
    min_stock: int

class ReserveItem(BaseModel):
    product_id: str
    quantity: int

class ReserveRequest(BaseModel):
    request_id: str
    items: List[ReserveItem]

class ReservationAction(BaseModel):
    reservation_id: str
