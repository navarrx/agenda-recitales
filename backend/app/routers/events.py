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
    genres: Optional[List[str]] = Query(None, alias="genres"),
    city: Optional[str] = None,
    cities: Optional[List[str]] = Query(None, alias="cities"),
    date: Optional[date] = None,  # Compatibilidad con parámetro date
    end_date: Optional[date] = Query(None, alias="end_date"),  # Nuevo parámetro para rango de fechas
    date_from: Optional[date] = Query(None, alias="date_from"),
    date_to: Optional[date] = Query(None, alias="date_to"),
    search: Optional[str] = None,
    date_types: Optional[List[str]] = Query(None, alias="date_types"),
    show_past: bool = Query(False, description="Incluir eventos pasados"),
    db: Session = Depends(database.get_db)
):
    """
    Get events with filtering options (route without leading slash)
    """
    logger.info(f"GET /events request received (root route)")
    logger.info(f"Query params: skip={skip}, limit={limit}, genre={genre}, genres={genres}, city={city}, cities={cities}, date={date}, end_date={end_date}, date_from={date_from}, date_to={date_to}, date_types={date_types}")
    logger.info(f"Headers: {dict(request.headers)}")
    
    # Procesar parámetros de fecha para rango
    if date and end_date:
        # Si tenemos date y end_date, usar como rango
        date_from = date
        date_to = end_date
    elif date:
        # Si solo tenemos date, usar como fecha específica
        date_from = date
        date_to = date
    # Si no hay date pero hay end_date, date_from debe estar definido por el frontend
    
    events = crud.get_events(
        db, 
        skip=skip, 
        limit=limit, 
        genre=genre,
        genres=genres,
        city=city,
        cities=cities,
        date_from=date_from,
        date_to=date_to,
        search=search,
        date_types=date_types,
        show_past=show_past
    )
    return events

@router.get("/", response_model=schemas.EventList)
def read_events(
    request: Request,
    skip: int = 0,
    limit: int = 12,  # Cambiado a 12 para coincidir con el frontend
    genre: Optional[str] = None,
    genres: Optional[List[str]] = Query(None, alias="genres"),
    city: Optional[str] = None,
    cities: Optional[List[str]] = Query(None, alias="cities"),
    date: Optional[date] = None,  # Compatibilidad con parámetro date
    end_date: Optional[date] = Query(None, alias="end_date"),  # Nuevo parámetro para rango de fechas
    date_from: Optional[date] = Query(None, alias="date_from"),
    date_to: Optional[date] = Query(None, alias="date_to"),
    search: Optional[str] = None,
    date_types: Optional[List[str]] = Query(None, alias="date_types"),
    show_past: bool = Query(False, description="Incluir eventos pasados"),
    db: Session = Depends(database.get_db)
):
    """
    Get events with filtering options
    """
    logger.info(f"GET /events/ request received (with trailing slash)")
    logger.info(f"Query params: skip={skip}, limit={limit}, genre={genre}, genres={genres}, city={city}, cities={cities}, date={date}, end_date={end_date}, date_from={date_from}, date_to={date_to}, date_types={date_types}")
    logger.info(f"Headers: {dict(request.headers)}")
    
    # Procesar parámetros de fecha para rango
    if date and end_date:
        # Si tenemos date y end_date, usar como rango
        date_from = date
        date_to = end_date
    elif date:
        # Si solo tenemos date, usar como fecha específica
        date_from = date
        date_to = date
    # Si no hay date pero hay end_date, date_from debe estar definido por el frontend
    
    events = crud.get_events(
        db, 
        skip=skip, 
        limit=limit, 
        genre=genre,
        genres=genres,
        city=city,
        cities=cities,
        date_from=date_from,
        date_to=date_to,
        search=search,
        date_types=date_types,
        show_past=show_past
    )
    return events

@router.get("/featured", response_model=schemas.EventList)
def get_featured_events(
    request: Request,
    skip: int = 0,
    limit: int = 12,
    db: Session = Depends(database.get_db)
):
    """
    Get featured events
    """
    logger.info(f"GET /events/featured request received")
    logger.info(f"Query params: skip={skip}, limit={limit}")
    
    events = crud.get_featured_events(
        db, 
        skip=skip, 
        limit=limit
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
    genre: Optional[str] = None,
    genres: Optional[List[str]] = Query(None, alias="genres"),
    city: Optional[str] = None,
    cities: Optional[List[str]] = Query(None, alias="cities"),
    date_from: Optional[date] = Query(None, alias="date_from"),
    date_to: Optional[date] = Query(None, alias="date_to"),
    search: Optional[str] = None,
    date_types: Optional[List[str]] = Query(None, alias="date_types"),
    db: Session = Depends(database.get_db)
):
    """
    Get events within a certain radius of given coordinates
    """
    logger.info(f"GET /events/nearby request received")
    logger.info(f"Query params: lat={lat}, lng={lng}, radius={radius}, skip={skip}, limit={limit}, genre={genre}, genres={genres}, city={city}, cities={cities}, date_from={date_from}, date_to={date_to}, search={search}, date_types={date_types}")
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
        limit=limit,
        genre=genre,
        genres=genres,
        city=city,
        cities=cities,
        date_from=date_from,
        date_to=date_to,
        search=search,
        date_types=date_types
    )
    return events

@router.get("/{event_id}", response_model=schemas.Event)
def read_event(event_id: int, db: Session = Depends(database.get_db)):
    """
    Get a specific event by ID with hero event information
    """
    logger.info(f"GET /events/{event_id} request received")
    
    db_event = crud.get_event(db, event_id=event_id)
    if db_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if this event has a hero event associated
    hero_events = crud.get_hero_events(db)
    for hero_event in hero_events:
        if hero_event.event_id == event_id:
            # Set hero_active to True if this event is in hero banner
            db_event.hero_active = True
            break
    
    return db_event

@router.get("/{event_id}/with-hero-info")
def read_event_with_hero_info(event_id: int, db: Session = Depends(database.get_db)):
    """
    Get a specific event by ID with complete hero event information
    """
    logger.info(f"GET /events/{event_id}/with-hero-info request received")
    
    db_event = crud.get_event(db, event_id=event_id)
    if db_event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check if this event has a hero event associated
    hero_events = crud.get_hero_events(db)
    hero_info = None
    
    for hero_event in hero_events:
        if hero_event.event_id == event_id:
            # Set hero_active to True if this event is in hero banner
            db_event.hero_active = True
            hero_info = {
                "id": hero_event.id,
                "hero_image_url": hero_event.hero_image_url,
                "order_position": hero_event.order_position,
                "is_active": hero_event.is_active
            }
            break
    
    return {
        "event": db_event,
        "hero_info": hero_info
    }

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
    logger.info(f"Request body: {event}")
    try:
        logger.info("Calling crud.create_event...")
        result = crud.create_event(db=db, event=event)
        logger.info(f"Event created successfully: {result.id if result else None}")
        return result
    except Exception as e:
        logger.error(f"Exception in create_event_root: {e}", exc_info=True)
        raise

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
    logger.info(f"Request body: {event}")
    try:
        logger.info("Calling crud.create_event...")
        result = crud.create_event(db=db, event=event)
        logger.info(f"Event created successfully: {result.id if result else None}")
        return result
    except Exception as e:
        logger.error(f"Exception in create_event: {e}", exc_info=True)
        raise

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
    logger.info(f"Request body: {event}")
    try:
        logger.info("Calling crud.update_event...")
        db_event = crud.update_event(db, event_id=event_id, event=event)
        logger.info(f"crud.update_event returned: {db_event}")
        if db_event is None:
            logger.warning(f"Event not found: {event_id}")
            raise HTTPException(status_code=404, detail="Event not found")
        logger.info(f"Event updated successfully: {event_id}")
        return db_event
    except Exception as e:
        logger.error(f"Exception in update_event: {e}", exc_info=True)
        raise

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
    genres = [genre[0] for genre in genre_rows]
    logger.info(f"Genres found: {genres}")
    return genres

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
    genre: Optional[str] = Form(None),
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
    hero_active: bool = Form(False),
    hero_image: Optional[UploadFile] = File(None),
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
            ticket_price=ticket_price,
            hero_active=hero_active
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
        
        # Si es hero_active y hay hero_image, crear hero event
        if hero_active and hero_image:
            try:
                # Validar que sea una imagen
                if not hero_image.content_type or not hero_image.content_type.startswith('image/'):
                    raise HTTPException(
                        status_code=400,
                        detail="El archivo de imagen hero debe ser una imagen"
                    )
                
                # Validar tamaño (máximo 10MB)
                hero_file_content = await hero_image.read()
                if len(hero_file_content) > 10 * 1024 * 1024:
                    raise HTTPException(
                        status_code=400,
                        detail="El archivo hero es demasiado grande. Máximo 10MB permitido."
                    )
                
                # Subir imagen hero a S3
                hero_image_url = s3_service.upload_image(
                    file_content=hero_file_content,
                    file_name=f"hero_{hero_image.filename}",
                    content_type=hero_image.content_type
                )
                
                if not hero_image_url:
                    raise HTTPException(
                        status_code=500,
                        detail="Error al subir la imagen hero"
                    )
                
                # Crear hero event
                hero_event_data = schemas.HeroEventCreate(
                    event_id=created_event.id,
                    hero_image_url=hero_image_url,
                    order_position=0,  # Se calculará automáticamente
                    is_active=True
                )
                
                crud.create_hero_event(db, hero_event_data)
                logger.info(f"Hero event created for event: {created_event.id}")
                
            except Exception as e:
                logger.error(f"Error creating hero event: {e}")
                # No fallar la creación del evento principal si falla el hero
                pass
        
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
    hero_active: Optional[bool] = Form(None),
    hero_image: Optional[UploadFile] = File(None),
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
            ticket_price=ticket_price,
            hero_active=hero_active
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
        
        # Manejar hero_image si se proporciona
        if hero_image:
            try:
                # Validar que sea una imagen
                if not hero_image.content_type or not hero_image.content_type.startswith('image/'):
                    raise HTTPException(
                        status_code=400,
                        detail="El archivo de imagen hero debe ser una imagen"
                    )
                
                # Validar tamaño (máximo 10MB)
                hero_file_content = await hero_image.read()
                if len(hero_file_content) > 10 * 1024 * 1024:
                    raise HTTPException(
                        status_code=400,
                        detail="El archivo hero es demasiado grande. Máximo 10MB permitido."
                    )
                
                # Buscar hero event existente
                existing_hero_events = crud.get_hero_events(db)
                existing_hero_event = None
                for he in existing_hero_events:
                    if he.event_id == event_id:
                        existing_hero_event = he
                        break
                
                # Subir nueva imagen hero a S3
                hero_image_url = s3_service.upload_image(
                    file_content=hero_file_content,
                    file_name=f"hero_{hero_image.filename}",
                    content_type=hero_image.content_type
                )
                
                if not hero_image_url:
                    raise HTTPException(
                        status_code=500,
                        detail="Error al subir la imagen hero"
                    )
                
                if existing_hero_event:
                    # Actualizar hero event existente
                    # Eliminar imagen anterior si existe
                    if existing_hero_event.hero_image_url:
                        s3_service.delete_image(existing_hero_event.hero_image_url)
                    
                    # Actualizar con nueva imagen
                    existing_hero_event.hero_image_url = hero_image_url
                    db.commit()
                    logger.info(f"Hero event updated for event: {event_id}")
                else:
                    # Crear nuevo hero event
                    hero_event_data = schemas.HeroEventCreate(
                        event_id=event_id,
                        hero_image_url=hero_image_url,
                        order_position=0,  # Se calculará automáticamente
                        is_active=True
                    )
                    crud.create_hero_event(db, hero_event_data)
                    logger.info(f"Hero event created for event: {event_id}")
                
            except Exception as e:
                logger.error(f"Error handling hero image: {e}")
                # No fallar la actualización del evento principal si falla el hero
                pass
        
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