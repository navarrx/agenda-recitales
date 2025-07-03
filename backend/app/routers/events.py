from fastapi import APIRouter, Depends, HTTPException, Query, Request, Body, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date
import logging
from .. import crud, schemas, models, database, auth
from ..s3_service import s3_service

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
    date_types: Optional[List[str]] = Query(None, alias="date_types"),
    db: Session = Depends(database.get_db)
):
    """
    Get events with filtering options (route without leading slash)
    """
    logger.info(f"GET /events request received (root route)")
    logger.info(f"Query params: skip={skip}, limit={limit}, genre={genre}, city={city}, date={date}, date_from={date_from}, date_to={date_to}, date_types={date_types}")
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
        search=search,
        date_types=date_types
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
    date_types: Optional[List[str]] = Query(None, alias="date_types"),
    db: Session = Depends(database.get_db)
):
    """
    Get events with filtering options
    """
    logger.info(f"GET /events/ request received (with trailing slash)")
    logger.info(f"Query params: skip={skip}, limit={limit}, genre={genre}, city={city}, date={date}, date_from={date_from}, date_to={date_to}, date_types={date_types}")
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
        search=search,
        date_types=date_types
    )
    return events

@router.get("/nearby", response_model=schemas.EventList)
def get_nearby_events(
    request: Request,
    lat: float = Query(..., description="Latitude of the user's location"),
    lng: float = Query(..., description="Longitude of the user's location"),
    radius: float = Query(100, description="Search radius in kilometers"),
    skip: int = 0,
    limit: int = 12,
    db: Session = Depends(database.get_db)
):
    """
    Get events within a certain radius of given coordinates
    """
    logger.info(f"GET /events/nearby request received")
    logger.info(f"Query params: lat={lat}, lng={lng}, radius={radius}, skip={skip}, limit={limit}")
    logger.info(f"Headers: {dict(request.headers)}")
    
    # Validate coordinates
    if not (-90 <= lat <= 90):
        raise HTTPException(status_code=400, detail="Latitude must be between -90 and 90")
    if not (-180 <= lng <= 180):
        raise HTTPException(status_code=400, detail="Longitude must be between -180 and 180")
    if radius <= 0:
        raise HTTPException(status_code=400, detail="Radius must be positive")
    
    events = crud.get_nearby_events(
        db,
        lat=lat,
        lng=lng,
        radius=radius,
        skip=skip,
        limit=limit
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
    
    # Obtener el evento antes de eliminarlo para poder eliminar la imagen
    event = crud.get_event(db, event_id=event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Eliminar la imagen de S3 si existe
    if event.image_url:
        try:
            s3_service.delete_image(event.image_url)
            logger.info(f"Image deleted from S3: {event.image_url}")
        except Exception as e:
            logger.warning(f"Could not delete image from S3: {e}")
    
    # Eliminar el evento de la base de datos
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
            # Obtener el evento antes de eliminarlo
            event = crud.get_event(db, event_id=event_id)
            if event:
                # Eliminar la imagen de S3 si existe
                if event.image_url:
                    try:
                        s3_service.delete_image(event.image_url)
                        logger.info(f"Image deleted from S3: {event.image_url}")
                    except Exception as e:
                        logger.warning(f"Could not delete image from S3: {e}")
                
                # Eliminar el evento
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

@router.post("/with-image", response_model=schemas.Event)
async def create_event_with_image(
    name: str = Form(...),
    artist: str = Form(...),
    genre: str = Form(...),
    date: str = Form(...),  # Se recibirá como string y se parseará
    location: str = Form(...),
    city: str = Form(...),
    venue: str = Form(...),
    description: str = Form(...),
    ticket_url: Optional[str] = Form(None),
    is_featured: bool = Form(False),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    date_types: Optional[str] = Form(None),  # Se recibirá como string JSON
    ticket_price: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    logger.info(f"POST /events/with-image - Usuario autenticado: {current_user.username}")
    """
    Create a new event with image upload (admin only)
    """
    try:
        logger.info(f"POST /events/with-image request received")
        
        # Parsear la fecha
        from datetime import datetime
        try:
            parsed_date = datetime.fromisoformat(date.replace('Z', '+00:00'))
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido")
        
        # Parsear date_types si se proporciona
        parsed_date_types = None
        if date_types:
            import json
            try:
                parsed_date_types = json.loads(date_types)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Formato de date_types inválido")
        
        # Crear el objeto EventCreate
        event_data = schemas.EventCreate(
            name=name,
            artist=artist,
            genre=genre,
            date=parsed_date,
            location=location,
            city=city,
            venue=venue,
            description=description,
            ticket_url=ticket_url,
            is_featured=is_featured,
            latitude=latitude,
            longitude=longitude,
            date_types=parsed_date_types,
            ticket_price=ticket_price
        )
        
        # Subir imagen si se proporciona
        image_url = None
        if image:
            # Validar que sea una imagen
            if not image.content_type or not image.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=400,
                    detail="El archivo debe ser una imagen"
                )
            
            # Validar tamaño (máximo 10MB)
            file_content = await image.read()
            if len(file_content) > 10 * 1024 * 1024:
                raise HTTPException(
                    status_code=400,
                    detail="El archivo es demasiado grande. Máximo 10MB permitido."
                )
            
            # Subir a S3
            image_url = s3_service.upload_image(
                file_content=file_content,
                file_name=image.filename or "event_image.jpg",
                content_type=image.content_type
            )
            
            if not image_url:
                raise HTTPException(
                    status_code=500,
                    detail="Error al subir la imagen"
                )
        
        # Actualizar el evento con la URL de la imagen
        event_data.image_url = image_url
        
        # Crear el evento en la base de datos
        created_event = crud.create_event(db=db, event=event_data)
        
        logger.info(f"Event created successfully with image: {created_event.id}")
        return created_event
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating event with image: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor"
        )

@router.put("/{event_id}/with-image", response_model=schemas.Event)
async def update_event_with_image(
    event_id: int,
    name: Optional[str] = Form(None),
    artist: Optional[str] = Form(None),
    genre: Optional[str] = Form(None),
    date: Optional[str] = Form(None),
    location: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    venue: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    ticket_url: Optional[str] = Form(None),
    is_featured: Optional[bool] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    date_types: Optional[str] = Form(None),
    ticket_price: Optional[int] = Form(None),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    """
    Update an existing event with optional image upload (admin only)
    """
    try:
        logger.info(f"PUT /events/{event_id}/with-image request received")
        
        # Verificar que el evento existe
        existing_event = crud.get_event(db, event_id=event_id)
        if not existing_event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Parsear la fecha si se proporciona
        parsed_date = None
        if date:
            from datetime import datetime
            try:
                parsed_date = datetime.fromisoformat(date.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Formato de fecha inválido")
        
        # Parsear date_types si se proporciona
        parsed_date_types = None
        if date_types:
            import json
            try:
                parsed_date_types = json.loads(date_types)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Formato de date_types inválido")
        
        # Crear el objeto EventUpdate
        event_data = schemas.EventUpdate(
            name=name,
            artist=artist,
            genre=genre,
            date=parsed_date,
            location=location,
            city=city,
            venue=venue,
            description=description,
            ticket_url=ticket_url,
            is_featured=is_featured,
            latitude=latitude,
            longitude=longitude,
            date_types=parsed_date_types,
            ticket_price=ticket_price
        )
        
        # Subir nueva imagen si se proporciona
        if image:
            # Validar que sea una imagen
            if not image.content_type or not image.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=400,
                    detail="El archivo debe ser una imagen"
                )
            
            # Validar tamaño (máximo 10MB)
            file_content = await image.read()
            if len(file_content) > 10 * 1024 * 1024:
                raise HTTPException(
                    status_code=400,
                    detail="El archivo es demasiado grande. Máximo 10MB permitido."
                )
            
            # Eliminar imagen anterior si existe
            if existing_event.image_url:
                s3_service.delete_image(existing_event.image_url)
            
            # Subir nueva imagen a S3
            image_url = s3_service.upload_image(
                file_content=file_content,
                file_name=image.filename or "event_image.jpg",
                content_type=image.content_type
            )
            
            if not image_url:
                raise HTTPException(
                    status_code=500,
                    detail="Error al subir la imagen"
                )
            
            # Actualizar con la nueva URL de imagen
            event_data.image_url = image_url
        
        # Actualizar el evento en la base de datos
        updated_event = crud.update_event(db, event_id=event_id, event=event_data)
        
        logger.info(f"Event updated successfully: {event_id}")
        return updated_event
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating event with image: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor"
        )