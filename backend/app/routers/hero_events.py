from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from .. import crud, schemas, models, database, auth
from ..s3_service import s3_service
import logging

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/hero-events",
    tags=["hero-events"]
)

@router.get("", response_model=List[schemas.HeroEvent])
def get_hero_events(db: Session = Depends(database.get_db)):
    """
    Get all active hero events ordered by position
    """
    logger.info("GET /hero-events - Fetching hero events")
    try:
        hero_events = crud.get_hero_events(db)
        logger.info(f"Found {len(hero_events)} hero events")
        return hero_events
    except Exception as e:
        logger.error(f"Error fetching hero events: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.post("", response_model=schemas.HeroEvent)
async def create_hero_event(
    event_id: int = Form(...),
    image: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """
    Add an event to the hero banner
    """
    logger.info(f"POST /hero-events - Creating hero event for event_id: {event_id}")
    
    try:
        # Validate that the event exists
        event = crud.get_event(db, event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Evento no encontrado")
        
        # Validate image file
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")
        
        # Validate file size (max 10MB)
        file_content = await image.read()
        if len(file_content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="El archivo es demasiado grande. Máximo 10MB permitido.")
        
        # Upload image to S3 with hero-specific prefix
        hero_image_url = s3_service.upload_image(
            file_content=file_content,
            file_name=f"hero_{image.filename}",
            content_type=image.content_type
        )
        
        if not hero_image_url:
            raise HTTPException(status_code=500, detail="Error al subir la imagen")
        
        # Create hero event
        hero_event_data = schemas.HeroEventCreate(
            event_id=event_id,
            hero_image_url=hero_image_url,
            order_position=0,  # Will be calculated automatically
            is_active=True
        )
        
        hero_event = crud.create_hero_event(db, hero_event_data)
        logger.info(f"Hero event created successfully with ID: {hero_event.id}")
        
        return hero_event
        
    except ValueError as e:
        logger.warning(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating hero event: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.put("/reorder")
def reorder_hero_events(
    request: dict,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """
    Reorder hero events based on the provided list of IDs
    """
    logger.info(f"PUT /hero-events/reorder - Request body: {request}")
    
    # Extract hero_event_ids from request body
    hero_event_ids = request.get("hero_event_ids", [])
    
    if not isinstance(hero_event_ids, list):
        raise HTTPException(status_code=400, detail="hero_event_ids debe ser una lista")
    
    logger.info(f"PUT /hero-events/reorder - Reordering hero events: {hero_event_ids}")
    
    try:
        if not hero_event_ids:
            raise HTTPException(status_code=400, detail="Lista de IDs de eventos hero requerida")
        
        # Validate that all hero events exist
        for hero_event_id in hero_event_ids:
            hero_event = crud.get_hero_event_by_id(db, hero_event_id)
            if not hero_event:
                raise HTTPException(status_code=404, detail=f"Hero event con ID {hero_event_id} no encontrado")
        
        success = crud.update_hero_event_order(db, hero_event_ids)
        if not success:
            raise HTTPException(status_code=500, detail="Error al reordenar los eventos")
        
        logger.info("Hero events reordered successfully")
        return {"message": "Orden actualizado correctamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reordering hero events: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.delete("/{hero_event_id}")
def delete_hero_event(
    hero_event_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """
    Remove an event from the hero banner
    """
    logger.info(f"DELETE /hero-events/{hero_event_id} - Deleting hero event")
    
    try:
        # Get the hero event before deleting it
        hero_event = crud.get_hero_event_by_id(db, hero_event_id)
        if not hero_event:
            raise HTTPException(status_code=404, detail="Hero event no encontrado")
        
        # Delete the image from S3 if it exists
        if hero_event.hero_image_url:
            try:
                s3_service.delete_image(hero_event.hero_image_url)
                logger.info(f"Image deleted from S3: {hero_event.hero_image_url}")
            except Exception as e:
                logger.warning(f"Could not delete image from S3: {e}")
        
        # Delete the hero event from database
        success = crud.delete_hero_event(db, hero_event_id)
        if not success:
            raise HTTPException(status_code=404, detail="Hero event no encontrado")
        
        logger.info(f"Hero event {hero_event_id} deleted successfully")
        return {"message": "Evento eliminado del hero banner"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting hero event: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/count")
def get_hero_events_count(db: Session = Depends(database.get_db)):
    """
    Get the current count of active hero events
    """
    try:
        count = crud.get_hero_events_count(db)
        return {"count": count}
    except Exception as e:
        logger.error(f"Error getting hero events count: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")
