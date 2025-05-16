from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime

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