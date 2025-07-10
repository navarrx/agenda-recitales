from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import logging
from typing import List
from .. import auth, database
from ..s3_service import s3_service
from ..models import User

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/upload",
    tags=["upload"]
)

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """
    Sube una imagen al bucket de S3 (solo administradores)
    
    Args:
        file: Archivo de imagen a subir
        db: Sesión de base de datos
        current_user: Usuario autenticado (debe ser admin)
        
    Returns:
        URL de la imagen subida
    """
    try:
        # Validar que el archivo sea una imagen
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400, 
                detail="El archivo debe ser una imagen (JPEG, PNG, GIF, etc.)"
            )
        
        # Validar tamaño del archivo (máximo 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        file_content = await file.read()
        
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=400,
                detail="El archivo es demasiado grande. Máximo 10MB permitido."
            )
        
        # Subir imagen a S3
        image_url = s3_service.upload_image(
            file_content=file_content,
            file_name=file.filename or "image.jpg",
            content_type=file.content_type
        )
        
        if not image_url:
            raise HTTPException(
                status_code=500,
                detail="Error al subir la imagen. Intente nuevamente."
            )
        
        logger.info(f"Image uploaded by admin {current_user.username}: {image_url}")
        
        return {
            "success": True,
            "image_url": image_url,
            "message": "Imagen subida exitosamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor al subir la imagen"
        )

@router.post("/pending-image")
async def upload_pending_image(
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    """
    Sube una imagen pendiente al bucket de S3 (público, sin autenticación)
    
    Args:
        file: Archivo de imagen a subir
        db: Sesión de base de datos
        
    Returns:
        URL de la imagen pendiente subida
    """
    logger.info(f"POST /upload/pending-image - Iniciando procesamiento")
    try:
        logger.info(f"Archivo recibido: {file.filename}, tipo: {file.content_type}")
        
        # Validar que el archivo sea una imagen
        if not file.content_type or not file.content_type.startswith('image/'):
            logger.error(f"Tipo de archivo inválido: {file.content_type}")
            raise HTTPException(
                status_code=400, 
                detail="El archivo debe ser una imagen (JPEG, PNG, GIF, etc.)"
            )
        
        # Validar tamaño del archivo (máximo 5MB para usuarios públicos)
        max_size = 5 * 1024 * 1024  # 5MB
        logger.info("Leyendo contenido del archivo...")
        file_content = await file.read()
        logger.info(f"Archivo leído, tamaño: {len(file_content)} bytes")
        
        if len(file_content) > max_size:
            logger.error(f"Archivo demasiado grande: {len(file_content)} bytes")
            raise HTTPException(
                status_code=400,
                detail="El archivo es demasiado grande. Máximo 5MB permitido."
            )
        
        # Subir imagen pendiente a S3
        logger.info("Subiendo imagen a S3...")
        image_url = s3_service.upload_pending_image(
            file_content=file_content,
            file_name=file.filename or "pending_image.jpg",
            content_type=file.content_type
        )
        
        if not image_url:
            logger.error("Error al subir imagen a S3")
            raise HTTPException(
                status_code=500,
                detail="Error al subir la imagen. Intente nuevamente."
            )
        
        logger.info(f"Imagen subida exitosamente: {image_url}")
        
        return {
            "success": True,
            "image_url": image_url,
            "message": "Imagen pendiente subida exitosamente"
        }
        
    except HTTPException:
        logger.error("HTTPException en upload_pending_image")
        raise
    except Exception as e:
        logger.error(f"Error inesperado en upload_pending_image: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor al subir la imagen"
        )

@router.delete("/image")
async def delete_image(
    image_url: str,
    db: Session = Depends(database.get_db),
    current_user: User = Depends(auth.get_current_admin_user)
):
    """
    Elimina una imagen del bucket de S3 (solo administradores)
    
    Args:
        image_url: URL de la imagen a eliminar
        db: Sesión de base de datos
        current_user: Usuario autenticado (debe ser admin)
        
    Returns:
        Confirmación de eliminación
    """
    try:
        # Validar que la URL sea válida
        if not image_url or not image_url.startswith('http'):
            raise HTTPException(
                status_code=400,
                detail="URL de imagen inválida"
            )
        
        # Eliminar imagen de S3
        success = s3_service.delete_image(image_url)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Error al eliminar la imagen. Intente nuevamente."
            )
        
        logger.info(f"Image deleted by admin {current_user.username}: {image_url}")
        
        return {
            "success": True,
            "message": "Imagen eliminada exitosamente"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting image: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error interno del servidor al eliminar la imagen"
        ) 