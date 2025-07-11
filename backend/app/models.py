from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime
from sqlalchemy.dialects import postgresql

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    artist = Column(String, index=True)
    genre = Column(String, index=True)
    date = Column(DateTime, index=True)
    location = Column(String)
    city = Column(String, index=True)
    venue = Column(String)
    description = Column(Text)
    image_url = Column(String, nullable=True)
    ticket_url = Column(String, nullable=True)
    is_featured = Column(Boolean, default=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    date_types = Column(postgresql.ARRAY(String), nullable=True)
    ticket_price = Column(Integer, nullable=True)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class EventRequest(Base):
    __tablename__ = "event_requests"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String)
    event_name = Column(String)
    artist = Column(String)
    date = Column(DateTime)
    venue = Column(String)
    city = Column(String)
    ticket_url = Column(String)
    message = Column(Text)
    image_url = Column(String, nullable=True)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now()) 

class Venue(Base):
    __tablename__ = "venues"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location = Column(String, nullable=True)  # Campo adicional para ubicación descriptiva
    city = Column(String, index=True, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now()) 