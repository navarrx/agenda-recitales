from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, schemas
from ..database import get_db
from ..auth import get_current_admin_user

router = APIRouter()

@router.get("/venues/", response_model=schemas.VenueList)
def read_venues(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    city: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Get list of venues with optional filtering"""
    return crud.get_venues(db, skip=skip, limit=limit, city=city, search=search)

@router.get("/venues/{venue_id}", response_model=schemas.Venue)
def read_venue(venue_id: int, db: Session = Depends(get_db)):
    """Get a specific venue by ID"""
    venue = crud.get_venue(db, venue_id=venue_id)
    if venue is None:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue

@router.post("/venues/", response_model=schemas.Venue)
def create_venue(
    venue: schemas.VenueCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Create a new venue (admin only)"""
    return crud.create_venue(db=db, venue=venue)

@router.put("/venues/{venue_id}", response_model=schemas.Venue)
def update_venue(
    venue_id: int,
    venue: schemas.VenueUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Update a venue (admin only)"""
    db_venue = crud.update_venue(db, venue_id=venue_id, venue=venue)
    if db_venue is None:
        raise HTTPException(status_code=404, detail="Venue not found")
    return db_venue

@router.delete("/venues/{venue_id}")
def delete_venue(
    venue_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Delete a venue (admin only)"""
    success = crud.delete_venue(db, venue_id=venue_id)
    if not success:
        raise HTTPException(status_code=404, detail="Venue not found")
    return {"message": "Venue deleted successfully"}

@router.get("/venues/cities/")
def get_venue_cities(db: Session = Depends(get_db)):
    """Get list of all cities that have venues"""
    cities = crud.get_venue_cities(db)
    return {"cities": [city[0] for city in cities if city[0]]}

@router.post("/venues/bulk/", response_model=List[schemas.Venue])
def bulk_create_venues(
    venues: List[schemas.VenueCreate],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    """Create multiple venues at once (admin only)"""
    if len(venues) > 1000:
        raise HTTPException(status_code=400, detail="Cannot create more than 1000 venues at once")
    return crud.bulk_create_venues(db=db, venues=venues) 