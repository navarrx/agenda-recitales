from fastapi import APIRouter, Depends, HTTPException, Query, Request, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import logging
from .. import crud, schemas, models, database, auth

# Configurar logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/events",
    tags=["events"]
)

# IMPORTANTE: Añadimos esta ruta explícita para asegurarnos de que GET /events funcione
@router.get("", response_model=schemas.EventList)  # Sin barra al principio
def read_events_root(
    request: Request,
    skip: int = 0,
    limit: int = 12,  # Cambiado a 12 para coincidir con el frontend
    genre: Optional[str] = None,
    city: Optional[str] = None,
    date: Optional[date] = None,  # Compatibilidad con parámetro date
    date_from: Optional[date] = Query(None, alias="date_from"),
    date_to: Optional[date] = Query(None, alias="date_to"),
    search: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """
    Get events with filtering options (route without leading slash)
    """
    logger.info(f"GET /events request received (root route)")
    logger.info(f"Query params: skip={skip}, limit={limit}, genre={genre}, city={city}, date={date}, date_from={date_from}, date_to={date_to}")
    logger.info(f"Headers: {dict(request.headers)}")
    # Si se proporciona una fecha específica, usarla como date_from y date_to
    if date:
        date_from = date
        date_to = date
    events = crud.get_events(
        db, 
        skip=skip, 
        limit=limit, 
        genre=genre,
        city=city,
        date_from=date_from,
        date_to=date_to,
        search=search
    )
    return events

@router.get("/", response_model=schemas.EventList)
def read_events(
    request: Request,
    skip: int = 0,
    limit: int = 12,  # Cambiado a 12 para coincidir con el frontend
    genre: Optional[str] = None,
    city: Optional[str] = None,
    date: Optional[date] = None,  # Compatibilidad con parámetro date
    date_from: Optional[date] = Query(None, alias="date_from"),
    date_to: Optional[date] = Query(None, alias="date_to"),
    search: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """
    Get events with filtering options
    """
    logger.info(f"GET /events/ request received (with trailing slash)")
    logger.info(f"Query params: skip={skip}, limit={limit}, genre={genre}, city={city}, date={date}, date_from={date_from}, date_to={date_to}")
    logger.info(f"Headers: {dict(request.headers)}")
    # Si se proporciona una fecha específica, usarla como date_from y date_to
    if date:
        date_from = date
        date_to = date
    events = crud.get_events(
        db, 
        skip=skip, 
        limit=limit, 
        genre=genre,
        city=city,
        date_from=date_from,
        date_to=date_to,
        search=search
    )
    return events

@router.get("/{event_id}", response_model=schemas.Event)
def read_event(event_id: int, db: Session = Depends(database.get_db)):
    """
    Get a specific event by ID
    """
    logger.info(f"GET /events/{event_id} request received")
    
    db_event = crud.get_event(db, event_id=event_id)
    if db_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_event

@router.post("", response_model=schemas.Event)
def create_event_root(
    event: schemas.EventCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """
    Create a new event (admin only) - route without trailing slash
    """
    logger.info(f"POST /events request received (root route)")
    return crud.create_event(db=db, event=event)

@router.post("/", response_model=schemas.Event)
def create_event(
    event: schemas.EventCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """
    Create a new event (admin only)
    """
    logger.info(f"POST /events request received")
    return crud.create_event(db=db, event=event)

@router.put("/{event_id}", response_model=schemas.Event)
def update_event(
    event_id: int,
    event: schemas.EventUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """
    Update an existing event (admin only)
    """
    logger.info(f"PUT /events/{event_id} request received")
    
    db_event = crud.update_event(db, event_id=event_id, event=event)
    if db_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_event

@router.delete("/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """
    Delete an event (admin only)
    """
    logger.info(f"DELETE /events/{event_id} request received")
    
    success = crud.delete_event(db, event_id=event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"detail": "Event deleted successfully"}

@router.post("/bulk-delete", response_model=dict)
async def delete_events_bulk(
    request: Request,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """
    Delete multiple events (admin only)
    """
    try:
        # Log the raw request body
        body = await request.json()
        logger.info(f"POST /events/bulk-delete request body: {body}")
        
        if not isinstance(body, dict) or 'event_ids' not in body:
            raise HTTPException(status_code=422, detail="Request body must contain 'event_ids' array")
        
        event_ids = body['event_ids']
        if not isinstance(event_ids, list):
            raise HTTPException(status_code=422, detail="'event_ids' must be an array")
        
        logger.info(f"Processing deletion of {len(event_ids)} events")
        
        deleted_count = 0
        for event_id in event_ids:
            if crud.delete_event(db, event_id=event_id):
                deleted_count += 1
        
        logger.info(f"Successfully deleted {deleted_count} events")
        
        return {
            "detail": f"Successfully deleted {deleted_count} events",
            "deleted_count": deleted_count
        }
    except Exception as e:
        logger.error(f"Error in bulk delete: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/filters/genres", response_model=List[str])
def get_genres(db: Session = Depends(database.get_db)):
    """
    Get all available genres
    """
    logger.info(f"GET /events/filters/genres request received")
    
    genre_rows = crud.get_genres(db)
    return [genre[0] for genre in genre_rows]

@router.get("/filters/cities", response_model=List[str])
def get_cities(db: Session = Depends(database.get_db)):
    """
    Get all available cities
    """
    logger.info(f"GET /events/filters/cities request received")
    
    city_rows = crud.get_cities(db)
    return [city[0] for city in city_rows]