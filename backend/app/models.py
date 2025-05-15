from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Float
from .database import Base
from datetime import datetime

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    artist = Column(String, index=True)
    genre = Column(String, index=True)
    date = Column(DateTime)
    location = Column(String)
    city = Column(String, index=True)
    venue = Column(String)
    description = Column(Text)
    image_url = Column(String)
    ticket_url = Column(String)
    is_featured = Column(Boolean, default=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 