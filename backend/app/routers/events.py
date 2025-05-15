from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
from .. import crud, schemas, models, database

router = APIRouter(
    prefix="/events",
    tags=["events"]
)

@router.get("/", response_model=schemas.EventList)
def read_events(
    skip: int = 0,
    limit: int = 100,
    genre: Optional[str] = None,
    city: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """
    Get events with filtering options
    """
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
    db_event = crud.get_event(db, event_id=event_id)
    if db_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_event

@router.post("/", response_model=schemas.Event)
def create_event(event: schemas.EventCreate, db: Session = Depends(database.get_db)):
    """
    Create a new event
    """
    return crud.create_event(db=db, event=event)

@router.put("/{event_id}", response_model=schemas.Event)
def update_event(event_id: int, event: schemas.EventUpdate, db: Session = Depends(database.get_db)):
    """
    Update an existing event
    """
    db_event = crud.update_event(db, event_id=event_id, event=event)
    if db_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    return db_event

@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(database.get_db)):
    """
    Delete an event
    """
    success = crud.delete_event(db, event_id=event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"detail": "Event deleted successfully"}

@router.get("/filters/genres", response_model=List[str])
def get_genres(db: Session = Depends(database.get_db)):
    """
    Get all available genres
    """
    genre_rows = crud.get_genres(db)
    return [genre[0] for genre in genre_rows]

@router.get("/filters/cities", response_model=List[str])
def get_cities(db: Session = Depends(database.get_db)):
    """
    Get all available cities
    """
    city_rows = crud.get_cities(db)
    return [city[0] for city in city_rows] 