from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, schemas, models, database, auth, security
import logging

logger = logging.getLogger(__name__)
logger.info("Router event_requests cargado correctamente")

router = APIRouter(
    prefix="/event-requests",
    tags=["event-requests"]
)

@router.post("/", response_model=schemas.EventRequest)
def create_event_request(event_request: schemas.EventRequestCreate, db: Session = Depends(database.get_db)):
    logger.info("=" * 50)
    logger.info("ENDPOINT /event-requests/ - INICIANDO")
    logger.info("=" * 50)
    logger.info(f"POST /event-requests/ - Iniciando procesamiento")
    logger.info(f"Datos recibidos: {event_request.dict()}")
    
    # Sanitizar y validar datos
    request_data = event_request.dict()
    logger.info("Sanitizando datos...")
    
    # Sanitizar datos
    sanitized_data = security.sanitize_event_request_data(request_data)
    logger.info(f"Datos sanitizados: {sanitized_data}")
    
    # Validar datos
    logger.info("Validando datos...")
    validation_errors = security.validate_event_request_data(sanitized_data)
    
    if validation_errors:
        logger.error(f"Errores de validación: {validation_errors}")
        raise HTTPException(
            status_code=400,
            detail={"message": "Datos de entrada inválidos", "errors": validation_errors}
        )
    
    # Crear nuevo objeto con datos sanitizados
    logger.info("Creando objeto EventRequestCreate...")
    sanitized_request = schemas.EventRequestCreate(**sanitized_data)
    
    logger.info("Guardando en base de datos...")
    result = crud.create_event_request(db=db, event_request=sanitized_request)
    logger.info(f"Solicitud creada exitosamente con ID: {result.id}")
    
    return result

@router.get("/", response_model=List[schemas.EventRequest])
def list_event_requests(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    result = crud.get_event_requests(db, skip=skip, limit=limit, status=status)
    return result["items"]

@router.put("/{request_id}/status", response_model=schemas.EventRequest)
def update_event_request_status(
    request_id: int,
    status_update: schemas.EventRequestUpdateStatus,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_admin_user)
):
    updated = crud.update_event_request_status(db, request_id, status_update.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Event request not found")
    return updated 