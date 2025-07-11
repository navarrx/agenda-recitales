from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_
from . import models, schemas, security
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
    search: Optional[str] = None,
    date_types: Optional[List[str]] = None
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
        # Validación adicional de seguridad para el parámetro de búsqueda
        if len(search) > 100:
            search = search[:100]  # Limitar longitud
        
        search_filter = or_(
            models.Event.name.ilike(f"%{search}%"),
            models.Event.artist.ilike(f"%{search}%"),
            models.Event.description.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    if date_types:
        # Filtrar eventos que tengan todas las características seleccionadas
        query = query.filter(models.Event.date_types.contains(date_types))
    
    # Count total results
    total = query.count()
    
    # Order by date and apply pagination
    events = query.order_by(models.Event.date).offset(skip).limit(limit + 1).all()
    
    # Check if there are more results
    has_more = len(events) > limit
    if has_more:
        events = events[:-1]  # Remove the extra item we fetched
    
    return {
        "items": events,
        "total": total,
        "hasMore": has_more
    }

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
        for key, value in event.dict(exclude_unset=True).items():
            setattr(db_event, key, value)
        db_event.updated_at = func.now()
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

def get_nearby_events(
    db: Session,
    lat: float,
    lng: float,
    radius: float = 50,  # km
    skip: int = 0,
    limit: int = 12
):
    """
    Get events within a certain radius of given coordinates using Haversine formula
    """
    # Haversine formula in SQL
    # 6371 is Earth's radius in kilometers
    distance_expr = 6371 * func.acos(
        func.cos(func.radians(lat)) *
        func.cos(func.radians(models.Event.latitude)) *
        func.cos(func.radians(models.Event.longitude) - func.radians(lng)) +
        func.sin(func.radians(lat)) *
        func.sin(func.radians(models.Event.latitude))
    )
    
    # Query events with coordinates, calculate distance, and filter by radius
    query = db.query(models.Event, distance_expr.label('distance')).filter(
        models.Event.latitude.isnot(None),
        models.Event.longitude.isnot(None),
        distance_expr <= radius
    ).order_by('distance')
    
    # Count total results
    total = query.count()
    
    # Apply pagination
    results = query.offset(skip).limit(limit + 1).all()
    
    # Check if there are more results
    has_more = len(results) > limit
    if has_more:
        results = results[:-1]  # Remove the extra item we fetched
    
    # Extract events from results (results are tuples of (event, distance))
    events = [result[0] for result in results]
    
    return {
        "items": events,
        "total": total,
        "hasMore": has_more
    }

def create_event_request(db: Session, event_request: schemas.EventRequestCreate):
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info("crud.create_event_request - Iniciando creación de solicitud...")
    
    # Combinar fecha y hora en un solo campo DateTime
    event_data = event_request.dict()
    date_str = event_data.pop('date')
    time_str = event_data.pop('time', None)
    
    # Crear datetime combinando fecha y hora
    if time_str:
        # Si hay hora, combinar fecha y hora
        datetime_str = f"{date_str} {time_str}:00"
        combined_datetime = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M:%S')
        logger.info(f"crud.create_event_request - Combinando fecha y hora: {combined_datetime}")
    else:
        # Si no hay hora, usar solo la fecha con hora 00:00:00
        combined_datetime = datetime.strptime(date_str, '%Y-%m-%d')
        logger.info(f"crud.create_event_request - Solo fecha (sin hora): {combined_datetime}")
    
    # Crear el objeto EventRequest con la fecha combinada
    db_request = models.EventRequest(
        **event_data,
        date=combined_datetime
    )
    
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    
    logger.info(f"crud.create_event_request - Solicitud creada con ID: {db_request.id}")
    return db_request

def get_event_requests(db: Session, skip: int = 0, limit: int = 100, status: Optional[str] = None):
    query = db.query(models.EventRequest)
    if status:
        query = query.filter(models.EventRequest.status == status)
    total = query.count()
    requests = query.order_by(models.EventRequest.created_at.desc()).offset(skip).limit(limit).all()
    return {"items": requests, "total": total}

def update_event_request_status(db: Session, request_id: int, status: str):
    db_request = db.query(models.EventRequest).filter(models.EventRequest.id == request_id).first()
    if db_request:
        db_request.status = status
        db_request.updated_at = func.now()
        db.commit()
        db.refresh(db_request)
    return db_request

# Venue CRUD operations
def get_venues(db: Session, skip: int = 0, limit: int = 100, city: Optional[str] = None, search: Optional[str] = None):
    query = db.query(models.Venue)
    
    if city:
        query = query.filter(models.Venue.city == city)
    if search:
        if len(search) > 100:
            search = search[:100]
        
        search_filter = or_(
            models.Venue.name.ilike(f"%{search}%"),
            models.Venue.address.ilike(f"%{search}%"),
            models.Venue.location.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)
    
    total = query.count()
    venues = query.order_by(models.Venue.name).offset(skip).limit(limit).all()
    
    return {
        "items": venues,
        "total": total
    }

def get_venue(db: Session, venue_id: int):
    return db.query(models.Venue).filter(models.Venue.id == venue_id).first()

def create_venue(db: Session, venue: schemas.VenueCreate):
    db_venue = models.Venue(**venue.dict())
    db.add(db_venue)
    db.commit()
    db.refresh(db_venue)
    return db_venue

def update_venue(db: Session, venue_id: int, venue: schemas.VenueUpdate):
    db_venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if db_venue:
        for key, value in venue.dict(exclude_unset=True).items():
            setattr(db_venue, key, value)
        db_venue.updated_at = func.now()
        db.commit()
        db.refresh(db_venue)
    return db_venue

def delete_venue(db: Session, venue_id: int):
    db_venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if db_venue:
        db.delete(db_venue)
        db.commit()
        return True
    return False

def get_venue_cities(db: Session):
    return db.query(models.Venue.city).distinct().filter(models.Venue.city.isnot(None)).all()

def bulk_create_venues(db: Session, venues: List[schemas.VenueCreate]):
    """Create multiple venues in a single transaction"""
    db_venues = []
    for venue_data in venues:
        db_venue = models.Venue(**venue_data.dict())
        db_venues.append(db_venue)
    
    db.add_all(db_venues)
    db.commit()
    
    # Refresh all venues to get their IDs
    for venue in db_venues:
        db.refresh(venue)
    
    return db_venues 