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

# Patrones peligrosos
DANGEROUS_HEADERS = re.compile(r'^(x-forwarded-for|x-real-ip|x-forwarded-proto|x-forwarded-host)$', re.IGNORECASE)
SQL_INJECTION_PATTERNS = re.compile(
    r'\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)\b',
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
            
            # Excluir rutas de autenticación de la validación estricta
            if request.url.path in ["/auth/token", "/auth/login"]:
                return await self.app(scope, receive, send)
            
            # Validar headers
            if not self._validate_headers(request.headers):
                return await self._send_error_response(send, 400, "Headers inválidos")
            
            # Validar query parameters
            if not self._validate_query_params(request.query_params):
                return await self._send_error_response(send, 400, "Parámetros de consulta inválidos")
            
            # Para solicitudes POST/PUT, validar body
            if request.method in ["POST", "PUT", "PATCH"]:
                try:
                    body = await request.body()
                    if body:
                        if not self._validate_request_body(body, request.headers.get("content-type", "")):
                            return await self._send_error_response(send, 400, "Contenido de solicitud inválido")
                except Exception as e:
                    logger.warning(f"Error validando body de solicitud: {e}")
                    return await self._send_error_response(send, 400, "Error procesando solicitud")
        
        return await self.app(scope, receive, send)
    
    def _validate_headers(self, headers: Dict[str, str]) -> bool:
        """
        Valida headers de la solicitud
        """
        for name, value in headers.items():
            # Verificar headers peligrosos
            if DANGEROUS_HEADERS.match(name):
                logger.warning(f"Header peligroso detectado: {name}")
                return False
            
            # Verificar contenido malicioso en headers
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
            if "application/json" in content_type:
                # Validar JSON
                data = json.loads(body.decode('utf-8'))
                return self._validate_json_data(data)
            elif "application/x-www-form-urlencoded" in content_type:
                # Validar form data
                form_data = body.decode('utf-8')
                return self._validate_form_data(form_data)
            else:
                # Para otros tipos de contenido, verificar que no contenga patrones maliciosos
                body_str = body.decode('utf-8', errors='ignore')
                return not (SQL_INJECTION_PATTERNS.search(body_str) or XSS_PATTERNS.search(body_str))
        
        except (json.JSONDecodeError, UnicodeDecodeError) as e:
            logger.warning(f"Error decodificando body: {e}")
            return False
    
    def _validate_json_data(self, data: Any) -> bool:
        """
        Valida datos JSON recursivamente
        """
        if isinstance(data, dict):
            for key, value in data.items():
                if not self._validate_json_key(key) or not self._validate_json_data(value):
                    return False
        elif isinstance(data, list):
            for item in data:
                if not self._validate_json_data(item):
                    return False
        elif isinstance(data, str):
            if SQL_INJECTION_PATTERNS.search(data) or XSS_PATTERNS.search(data):
                logger.warning(f"Contenido malicioso en JSON: {data}")
                return False
            if len(data) > 10000:  # Límite de 10KB por campo
                logger.warning("Campo JSON demasiado largo")
                return False
        
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
                if not self._validate_json_key(key) or SQL_INJECTION_PATTERNS.search(value) or XSS_PATTERNS.search(value):
                    logger.warning(f"Form data malicioso: {line}")
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
        await response(scope=None, receive=None, send=send)

def add_security_middleware(app):
    """
    Agrega middleware de seguridad a la aplicación
    """
    app.add_middleware(SecurityMiddleware)
    return app 