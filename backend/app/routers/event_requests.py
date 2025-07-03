from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import crud, schemas, models, database, auth, security

router = APIRouter(
    prefix="/event-requests",
    tags=["event-requests"]
)

@router.post("/", response_model=schemas.EventRequest)
def create_event_request(event_request: schemas.EventRequestCreate, db: Session = Depends(database.get_db)):
    # Sanitizar y validar datos
    request_data = event_request.dict()
    
    # Sanitizar datos
    sanitized_data = security.sanitize_event_request_data(request_data)
    
    # Validar datos
    validation_errors = security.validate_event_request_data(sanitized_data)
    
    if validation_errors:
        raise HTTPException(
            status_code=400,
            detail={"message": "Datos de entrada inválidos", "errors": validation_errors}
        )
    
    # Crear nuevo objeto con datos sanitizados
    sanitized_request = schemas.EventRequestCreate(**sanitized_data)
    
    return crud.create_event_request(db=db, event_request=sanitized_request)

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