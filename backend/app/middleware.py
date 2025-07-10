"""
Middleware de seguridad para validar y sanitizar solicitudes HTTP
"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
import re
import json
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

# --- FIX STARTS HERE ---

# Patrones peligrosos
# REMOVED x-forwarded-for, x-real-ip, x-forwarded-proto, x-forwarded-host
# These headers are legitimate when behind a load balancer and should not be blocked.
# If you have other specific headers you consider dangerous in YOUR specific setup
# that are NOT standard proxy headers, you can add them here.
DANGEROUS_HEADERS = re.compile(r'^(some-other-truly-dangerous-header)$', re.IGNORECASE)
# If there are NO other truly dangerous headers you want to block by name, you can make this regex empty
# or remove the check entirely, but keeping it as an empty regex pattern is safer for future additions.
# Example if no other headers are universally "dangerous" to your app:
# DANGEROUS_HEADERS = re.compile(r'^$', re.IGNORECASE) # This regex will match nothing

# --- FIX ENDS HERE ---

SQL_INJECTION_PATTERNS = re.compile(
    r'\b(union\s+select|select\s+union|insert\s+into|update\s+set|delete\s+from|drop\s+table|create\s+table|alter\s+table|exec\s+sp_|execute\s+sp_|javascript:|vbscript:|onload\s*=|onerror\s*=|onclick\s*=)\b',
    re.IGNORECASE
)
XSS_PATTERNS = re.compile(
    r'<script[^>]*>.*?</script>|<iframe[^>]*>.*?</iframe>|<object[^>]*>.*?</object>|<embed[^>]*>.*?</embed>',
    re.IGNORECASE
)

class SecurityMiddleware:
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            logger.info(f"Middleware - Procesando solicitud: {request.method} {request.url.path}")
            
            # Excluir rutas de autenticación, upload y event_requests de la validación estricta
            if (request.url.path in ["/auth/token", "/auth/login"] or 
                request.url.path.startswith("/upload/") or
                request.url.path.startswith("/event-requests/")):
                logger.info(f"Middleware - Ruta excluida de validación: {request.url.path}")
                return await self.app(scope, receive, send)
            
            # Validar headers
            logger.info("Middleware - Validando headers...")
            if not self._validate_headers(request.headers):
                logger.error("Middleware - Headers inválidos detectados")
                return await self._send_error_response(send, 400, "Headers inválidos")
            
            # Validar query parameters
            logger.info("Middleware - Validando query parameters...")
            if not self._validate_query_params(request.query_params):
                logger.error("Middleware - Query parameters inválidos detectados")
                return await self._send_error_response(send, 400, "Parámetros de consulta inválidos")
            
            # Para solicitudes POST/PUT, validar body
            if request.method in ["POST", "PUT", "PATCH"]:
                logger.info(f"Middleware - Validando body para {request.method}...")
                try:
                    body = await request.body()
                    if body:
                        logger.info(f"Middleware - Body recibido, tamaño: {len(body)} bytes")
                        if not self._validate_request_body(body, request.headers.get("content-type", "")):
                            logger.error("Middleware - Body inválido detectado")
                            return await self._send_error_response(send, 400, "Contenido de solicitud inválido")
                        logger.info("Middleware - Body validado correctamente")
                    else:
                        logger.info("Middleware - Body vacío")
                except Exception as e:
                    logger.error(f"Middleware - Error validando body de solicitud: {e}")
                    return await self._send_error_response(send, 400, "Error procesando solicitud")
            
            logger.info("Middleware - Validación completada, pasando a la aplicación")
        return await self.app(scope, receive, send)
    
    def _validate_headers(self, headers: Dict[str, str]) -> bool:
        """
        Valida headers de la solicitud
        """
        for name, value in headers.items():
            # Verificar headers peligrosos - NOW ONLY CHECKS AGAINST THE MODIFIED DANGEROUS_HEADERS
            if DANGEROUS_HEADERS.match(name):
                logger.warning(f"Header peligroso detectado: {name} (was in DANGEROUS_HEADERS list)")
                return False
            
            # Verificar contenido malicioso en headers (SQLi/XSS) - KEEP THIS CHECK
            if value and (SQL_INJECTION_PATTERNS.search(value) or XSS_PATTERNS.search(value)):
                logger.warning(f"Contenido malicioso en header {name}: {value}")
                return False
        
        return True
    
    def _validate_query_params(self, query_params: Dict[str, str]) -> bool:
        """
        Valida parámetros de consulta
        """
        for name, value in query_params.items():
            if value:
                # Verificar contenido malicioso
                if SQL_INJECTION_PATTERNS.search(value) or XSS_PATTERNS.search(value):
                    logger.warning(f"Contenido malicioso en query param {name}: {value}")
                    return False
                
                # Verificar longitud excesiva
                if len(value) > 1000:
                    logger.warning(f"Query param demasiado largo: {name}")
                    return False
        
        return True
    
    def _validate_request_body(self, body: bytes, content_type: str) -> bool:
        """
        Valida el cuerpo de la solicitud
        """
        try:
            # Para multipart/form-data, no intentar decodificar como texto
            if "multipart/form-data" in content_type:
                # Para archivos, solo verificar que no sea demasiado grande
                if len(body) > 10 * 1024 * 1024:  # 10MB límite general
                    logger.warning("Body demasiado grande para multipart/form-data")
                    return False
                return True
            
            if "application/json" in content_type:
                # Validar JSON
                logger.info("Middleware - Validando JSON...")
                data = json.loads(body.decode('utf-8'))
                logger.info(f"Middleware - JSON decodificado: {data}")
                result = self._validate_json_data(data)
                logger.info(f"Middleware - Validación JSON resultado: {result}")
                return result
            elif "application/x-www-form-urlencoded" in content_type:
                # Validar form data
                form_data = body.decode('utf-8')
                return self._validate_form_data(form_data)
            else:
                # Para otros tipos de contenido, verificar que no contenga patrones maliciosos
                body_str = body.decode('utf-8', errors='ignore')
                return not (SQL_INJECTION_PATTERNS.search(body_str) or XSS_PATTERNS.search(body_str))
        
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            logger.error(f"Middleware - Error decodificando body: {e}")
            return False
    
    def _validate_json_data(self, data: Any) -> bool:
        """
        Valida datos JSON recursivamente
        """
        if isinstance(data, dict):
            logger.info(f"Middleware - Validando diccionario JSON con {len(data)} campos")
            for key, value in data.items():
                logger.info(f"Middleware - Validando campo: {key}")
                if not self._validate_json_key(key) or not self._validate_json_data(value):
                    logger.error(f"Middleware - Campo JSON inválido: {key}")
                    return False
            logger.info("Middleware - Diccionario JSON válido")
            return True # Ensure all dict items are checked before returning True
        elif isinstance(data, list):
            logger.info(f"Middleware - Validando lista JSON con {len(data)} elementos")
            for item in data:
                if not self._validate_json_data(item):
                    logger.error("Middleware - Elemento de lista JSON inválido")
                    return False
            logger.info("Middleware - Lista JSON válida")
            return True # Ensure all list items are checked before returning True
        elif isinstance(data, str):
            logger.info(f"Middleware - Validando string JSON: {data[:50]}...")
            if SQL_INJECTION_PATTERNS.search(data) or XSS_PATTERNS.search(data):
                logger.error(f"Middleware - Contenido malicioso en JSON: {data}")
                return False
            if len(data) > 10000:  # Límite de 10KB por campo
                logger.error("Middleware - Campo JSON demasiado largo")
                return False
            logger.info("Middleware - String JSON válido")
        
        return True
    
    def _validate_json_key(self, key: str) -> bool:
        """
        Valida claves JSON
        """
        if not key or len(key) > 100:
            return False
        
        if SQL_INJECTION_PATTERNS.search(key) or XSS_PATTERNS.search(key):
            logger.warning(f"Clave JSON maliciosa: {key}")
            return False
        
        return True
    
    def _validate_form_data(self, form_data: str) -> bool:
        """
        Valida datos de formulario
        """
        for line in form_data.split('&'):
            if '=' in line:
                key, value = line.split('=', 1)
                # It's better to validate the value separately, not combine with key validation here
                if SQL_INJECTION_PATTERNS.search(value) or XSS_PATTERNS.search(value):
                    logger.warning(f"Form data malicioso: {line}")
                    return False
                if not self._validate_json_key(key): # Re-use key validation for form keys
                    logger.warning(f"Clave de formulario maliciosa: {key}")
                    return False
            else: # Handle cases where there's no '=' (e.g., just a key)
                if SQL_INJECTION_PATTERNS.search(line) or XSS_PATTERNS.search(line):
                    logger.warning(f"Form data malicioso (no key=value format): {line}")
                    return False
                if len(line) > 1000: # Limit length for standalone values/keys
                     logger.warning(f"Form data demasiado largo: {line}")
                     return False
        
        return True
    
    async def _send_error_response(self, send, status_code: int, message: str):
        """
        Envía respuesta de error
        """
        response = JSONResponse(
            status_code=status_code,
            content={"detail": message}
        )
        # Manually construct and send ASGI response events
        await send({"type": "http.response.start", "status": response.status_code, "headers": response.raw_headers})
        await send({"type": "http.response.body", "body": response.body})


# Your add_security_middleware function in app/main.py or wherever you initialize your app
# should use this.
# Example:
# from fastapi import FastAPI
# from .middleware import SecurityMiddleware # Assuming it's in a submodule
# app = FastAPI()
# app.add_middleware(SecurityMiddleware) # This is the correct way if SecurityMiddleware is a BaseHTTPMiddleware-like class
# or
# app = add_security_middleware(app) # If you keep the helper function


# If you are using the `add_security_middleware` helper function, it also needs to be updated:
def add_security_middleware(app):
    """
    Agrega middleware de seguridad a la aplicación
    """
    app.add_middleware(SecurityMiddleware) # Assuming SecurityMiddleware is now an actual Starlette BaseHTTPMiddleware or similar
    return app
