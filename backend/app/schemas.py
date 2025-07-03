from pydantic import BaseModel, HttpUrl, validator, Field
from datetime import datetime
from typing import Optional, List, Union
import re

class EventBase(BaseModel):
    name: str
    artist: str
    genre: str
    date: datetime
    location: str
    city: str
    venue: str
    description: str
    image_url: Optional[str] = None
    ticket_url: Optional[str] = None
    is_featured: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    date_types: Optional[List[str]] = None
    ticket_price: Optional[int] = None

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    name: Optional[str] = None
    artist: Optional[str] = None
    genre: Optional[str] = None
    date: Optional[datetime] = None
    location: Optional[str] = None
    city: Optional[str] = None
    venue: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    ticket_url: Optional[str] = None
    is_featured: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    date_types: Optional[List[str]] = None
    ticket_price: Optional[int] = None

class Event(EventBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class EventList(BaseModel):
    items: List[Event]
    total: int
    hasMore: bool

    class Config:
        orm_mode = True

class BulkDeleteRequest(BaseModel):
    event_ids: List[int]

class EventRequestBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Nombre del solicitante")
    email: str = Field(..., description="Email del solicitante")
    event_name: str = Field(..., min_length=2, max_length=200, description="Nombre del evento")
    artist: str = Field(..., min_length=2, max_length=100, description="Artista o banda")
    date: datetime = Field(..., description="Fecha del evento")
    venue: str = Field(..., min_length=2, max_length=200, description="Lugar del evento")
    city: str = Field(..., min_length=2, max_length=100, description="Ciudad del evento")
    ticket_url: str = Field(..., description="URL de compra de entradas")
    message: Optional[str] = Field(None, max_length=1000, description="Información adicional")
    
    @validator('name', 'event_name', 'artist', 'venue', 'city')
    def validate_text_fields(cls, v):
        if not v or not isinstance(v, str):
            raise ValueError('Campo requerido')
        
        # Remover caracteres peligrosos
        dangerous_chars = re.compile(r'[<>"\']')
        if dangerous_chars.search(v):
            raise ValueError('El campo contiene caracteres no permitidos')
        
        # Verificar patrones de SQL injection
        sql_patterns = re.compile(
            r'\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b',
            re.IGNORECASE
        )
        if sql_patterns.search(v):
            raise ValueError('El campo contiene contenido no permitido')
        
        return v.strip()
    
    @validator('email')
    def validate_email(cls, v):
        if not v or not isinstance(v, str):
            raise ValueError('Email requerido')
        
        # Patrón de email
        email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        if not email_pattern.match(v):
            raise ValueError('Formato de email inválido')
        
        return v.lower().strip()
    
    @validator('ticket_url')
    def validate_url(cls, v):
        if not v or not isinstance(v, str):
            raise ValueError('URL requerida')
        
        # Patrón básico para URL
        url_pattern = re.compile(
            r'^https?://'  # http:// o https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # dominio
            r'localhost|'  # localhost
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # IP
            r'(?::\d+)?'  # puerto opcional
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        
        if not url_pattern.match(v):
            raise ValueError('Formato de URL inválido')
        
        return v.strip()
    
    @validator('date')
    def validate_future_date(cls, v):
        if not v:
            raise ValueError('Fecha requerida')
        
        if v <= datetime.now():
            raise ValueError('La fecha debe ser futura')
        
        return v
    
    @validator('message')
    def validate_message(cls, v):
        if v is None:
            return v
        
        if not isinstance(v, str):
            raise ValueError('El mensaje debe ser texto')
        
        # Remover caracteres peligrosos
        dangerous_chars = re.compile(r'[<>"\']')
        if dangerous_chars.search(v):
            raise ValueError('El mensaje contiene caracteres no permitidos')
        
        return v.strip()

class EventRequestCreate(EventRequestBase):
    pass

class EventRequest(EventRequestBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

class EventRequestUpdateStatus(BaseModel):
    status: str 