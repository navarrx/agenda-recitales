from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional, List, Union

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