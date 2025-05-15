from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from . import models, schemas
from typing import List, Optional
from datetime import datetime, date

def get_events(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    genre: Optional[str] = None,
    city: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None
):
    query = db.query(models.Event)
    
    # Apply filters
    if genre:
        query = query.filter(models.Event.genre == genre)
    if city:
        query = query.filter(models.Event.city == city)
    if date_from:
        query = query.filter(func.date(models.Event.date) >= date_from)
    if date_to:
        query = query.filter(func.date(models.Event.date) <= date_to)
    if search:
        search_filter = or_(
            models.Event.name.ilike(f"%{search}%"),
            models.Event.artist.ilike(f"%{search}%"),
            models.Event.description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    # Count total results
    total = query.count()
    
    # Order by date and apply pagination
    events = query.order_by(models.Event.date).offset(skip).limit(limit).all()
    
    return {"items": events, "total": total}

def get_event(db: Session, event_id: int):
    return db.query(models.Event).filter(models.Event.id == event_id).first()

def create_event(db: Session, event: schemas.EventCreate):
    db_event = models.Event(**event.dict())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def update_event(db: Session, event_id: int, event: schemas.EventUpdate):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if db_event:
        update_data = event.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_event, key, value)
        db_event.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_event)
    return db_event

def delete_event(db: Session, event_id: int):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if db_event:
        db.delete(db_event)
        db.commit()
        return True
    return False

def get_genres(db: Session):
    return db.query(models.Event.genre).distinct().all()

def get_cities(db: Session):
    return db.query(models.Event.city).distinct().all() 