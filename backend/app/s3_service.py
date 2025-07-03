import boto3
from botocore.exceptions import NoCredentialsError, ClientError
import logging
from typing import Optional
import uuid
from datetime import datetime
from .config import settings
from PIL import Image
import io

logger = logging.getLogger(__name__)

class S3Service:
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket_name = settings.S3_BUCKET_NAME
        self.bucket_url = settings.S3_BUCKET_URL

    def upload_image(self, file_content: bytes, file_name: str, content_type: str) -> Optional[str]:
        """
        Sube una imagen al bucket de S3 y retorna la URL pública
        
        Args:
            file_content: Contenido binario del archivo
            file_name: Nombre original del archivo
            content_type: Tipo MIME del archivo
            
        Returns:
            URL pública de la imagen subida o None si hay error
        """
        try:
            # Generar un nombre único para el archivo
            file_extension = file_name.split('.')[-1] if '.' in file_name else 'jpg'
            unique_filename = f"events/{datetime.now().strftime('%Y/%m/%d')}/{uuid.uuid4()}.{file_extension}"
            
            # Optimizar la imagen si es necesario
            optimized_content = self._optimize_image(file_content, content_type)
            
            # Subir archivo a S3 (sin ACL)
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=unique_filename,
                Body=optimized_content,
                ContentType=content_type
            )
            
            # Construir y retornar la URL pública
            public_url = f"{self.bucket_url}/{unique_filename}"
            logger.info(f"Image uploaded successfully: {public_url}")
            return public_url
            
        except NoCredentialsError:
            logger.error("AWS credentials not available")
            return None
        except ClientError as e:
            logger.error(f"AWS S3 error: {e}")
            return None
        except Exception as e:
            logger.error(f"Error uploading image: {e}")
            return None

    def _optimize_image(self, file_content: bytes, content_type: str) -> bytes:
        """
        Optimiza la imagen antes de subirla a S3
        
        Args:
            file_content: Contenido binario del archivo
            content_type: Tipo MIME del archivo
            
        Returns:
            Contenido optimizado de la imagen
        """
        try:
            # Solo optimizar si es una imagen
            if not content_type.startswith('image/'):
                return file_content
            
            # Abrir imagen con Pillow
            image = Image.open(io.BytesIO(file_content))
            
            # Convertir a RGB si es necesario (para JPEG)
            if content_type == 'image/jpeg' and image.mode in ('RGBA', 'LA', 'P'):
                image = image.convert('RGB')
            
            # Redimensionar si es muy grande (máximo 1920x1080)
            max_width = 1920
            max_height = 1080
            
            if image.width > max_width or image.height > max_height:
                image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
            
            # Guardar imagen optimizada
            output = io.BytesIO()
            
            if content_type == 'image/jpeg':
                image.save(output, format='JPEG', quality=85, optimize=True)
            elif content_type == 'image/png':
                image.save(output, format='PNG', optimize=True)
            else:
                # Para otros formatos, mantener el original
                return file_content
            
            output.seek(0)
            return output.getvalue()
            
        except Exception as e:
            logger.warning(f"Error optimizing image, using original: {e}")
            return file_content

    def delete_image(self, image_url: str) -> bool:
        """
        Elimina una imagen del bucket de S3
        
        Args:
            image_url: URL completa de la imagen
            
        Returns:
            True si se eliminó correctamente, False en caso contrario
        """
        try:
            # Extraer la clave del archivo de la URL
            if self.bucket_url in image_url:
                key = image_url.replace(f"{self.bucket_url}/", "")
                
                self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=key
                )
                
                logger.info(f"Image deleted successfully: {key}")
                return True
            else:
                logger.warning(f"Image URL does not belong to configured bucket: {image_url}")
                return False
                
        except ClientError as e:
            logger.error(f"Error deleting image: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error deleting image: {e}")
            return False

# Instancia global del servicio S3
s3_service = S3Service() 