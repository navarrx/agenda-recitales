"""
Utilidades de seguridad para sanitización y validación de datos
"""
import re
import html
from typing import Optional
from datetime import datetime, date

# Patrones peligrosos
DANGEROUS_CHARS = re.compile(r'[<>"\']')
SQL_INJECTION_PATTERNS = re.compile(
    r'\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror|onclick)\b',
    re.IGNORECASE
)
XSS_PATTERNS = re.compile(
    r'<script[^>]*>.*?</script>|<iframe[^>]*>.*?</iframe>|<object[^>]*>.*?</object>|<embed[^>]*>.*?</embed>',
    re.IGNORECASE
)

def sanitize_text(text: str, max_length: Optional[int] = None) -> str:
    """
    Sanitiza texto removiendo caracteres peligrosos y patrones maliciosos
    """
    if not text or not isinstance(text, str):
        return ''
    
    # Remover caracteres peligrosos
    sanitized = DANGEROUS_CHARS.sub('', text)
    
    # Remover patrones de SQL injection
    sanitized = SQL_INJECTION_PATTERNS.sub('', sanitized)
    
    # Remover patrones de XSS
    sanitized = XSS_PATTERNS.sub('', sanitized)
    
    # Normalizar espacios
    sanitized = re.sub(r'\s+', ' ', sanitized).strip()
    
    # Limitar longitud si se especifica
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized

def sanitize_search_text(text: str, max_length: Optional[int] = None) -> str:
    """
    Sanitiza texto de búsqueda permitiendo espacios pero removiendo caracteres peligrosos
    """
    if not text or not isinstance(text, str):
        return ''
    
    # Remover caracteres peligrosos
    sanitized = DANGEROUS_CHARS.sub('', text)
    
    # Remover patrones de SQL injection
    sanitized = SQL_INJECTION_PATTERNS.sub('', sanitized)
    
    # Remover patrones de XSS
    sanitized = XSS_PATTERNS.sub('', sanitized)
    
    # Normalizar espacios múltiples pero mantener espacios
    sanitized = re.sub(r'\s+', ' ', sanitized)
    
    # Limitar longitud si se especifica
    if max_length and len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    
    return sanitized

def sanitize_email(email: str) -> str:
    """
    Sanitiza email removiendo caracteres peligrosos pero manteniendo formato válido
    """
    if not email or not isinstance(email, str):
        return ''
    
    # Remover caracteres peligrosos pero mantener @ y .
    sanitized = re.sub(r'[<>"\']', '', email)
    
    # Normalizar espacios y convertir a minúsculas
    sanitized = re.sub(r'\s+', '', sanitized).lower().strip()
    
    return sanitized

def sanitize_url(url: str) -> str:
    """
    Sanitiza URL removiendo caracteres peligrosos pero manteniendo formato válido
    """
    if not url or not isinstance(url, str):
        return ''
    
    # Remover caracteres peligrosos
    sanitized = re.sub(r'[<>"\']', '', url)
    
    # Normalizar espacios
    sanitized = re.sub(r'\s+', '', sanitized).strip()
    
    return sanitized

def validate_email(email: str) -> bool:
    """
    Valida formato de email
    """
    if not email:
        return False
    
    pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    return bool(pattern.match(email))

def validate_url(url: str) -> bool:
    """
    Valida formato de URL
    """
    if not url:
        return False
    
    # Patrón básico para URL
    pattern = re.compile(
        r'^https?://'  # http:// o https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # dominio
        r'localhost|'  # localhost
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # IP
        r'(?::\d+)?'  # puerto opcional
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    return bool(pattern.match(url))

def validate_future_date(date_value: datetime) -> bool:
    """
    Valida que la fecha sea futura
    """
    if not date_value:
        return False
    
    return date_value > datetime.now()

def validate_length(text: str, max_length: int) -> bool:
    """
    Valida que el texto no exceda la longitud máxima
    """
    return len(text) <= max_length

def escape_html(text: str) -> str:
    """
    Escapa caracteres HTML para prevenir XSS
    """
    if not text:
        return ''
    
    return html.escape(text)

def sanitize_event_request_data(data: dict) -> dict:
    """
    Sanitiza todos los campos de una solicitud de evento
    """
    sanitized = {}
    
    # Sanitizar campos de texto
    if 'name' in data:
        sanitized['name'] = sanitize_text(data['name'], 100)
    
    if 'email' in data:
        sanitized['email'] = sanitize_email(data['email'])
    
    if 'event_name' in data:
        sanitized['event_name'] = sanitize_text(data['event_name'], 200)
    
    if 'artist' in data:
        sanitized['artist'] = sanitize_text(data['artist'], 100)
    
    if 'venue' in data:
        sanitized['venue'] = sanitize_text(data['venue'], 200)
    
    if 'city' in data:
        sanitized['city'] = sanitize_text(data['city'], 100)
    
    if 'ticket_url' in data:
        sanitized['ticket_url'] = sanitize_url(data['ticket_url'])
    
    if 'message' in data:
        sanitized['message'] = sanitize_text(data['message'], 1000)
    
    # La fecha no necesita sanitización
    if 'date' in data:
        sanitized['date'] = data['date']
    
    return sanitized

def validate_event_request_data(data: dict) -> list:
    """
    Valida todos los campos de una solicitud de evento
    Retorna lista de errores
    """
    errors = []
    
    # Validar nombre
    if 'name' in data:
        if not data['name'] or len(data['name']) < 2:
            errors.append('El nombre debe tener al menos 2 caracteres')
        elif not validate_length(data['name'], 100):
            errors.append('El nombre no puede exceder 100 caracteres')
    
    # Validar email
    if 'email' in data:
        if not data['email']:
            errors.append('El email es requerido')
        elif not validate_email(data['email']):
            errors.append('El email no tiene un formato válido')
    
    # Validar nombre del evento
    if 'event_name' in data:
        if not data['event_name'] or len(data['event_name']) < 2:
            errors.append('El nombre del evento debe tener al menos 2 caracteres')
        elif not validate_length(data['event_name'], 200):
            errors.append('El nombre del evento no puede exceder 200 caracteres')
    
    # Validar artista
    if 'artist' in data:
        if not data['artist'] or len(data['artist']) < 2:
            errors.append('El artista debe tener al menos 2 caracteres')
        elif not validate_length(data['artist'], 100):
            errors.append('El artista no puede exceder 100 caracteres')
    
    # Validar fecha
    if 'date' in data:
        if not data['date']:
            errors.append('La fecha es requerida')
        else:
            try:
                if isinstance(data['date'], str):
                    date_obj = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
                else:
                    date_obj = data['date']
                
                if not validate_future_date(date_obj):
                    errors.append('La fecha debe ser futura')
            except (ValueError, TypeError):
                errors.append('La fecha no tiene un formato válido')
    
    # Validar lugar
    if 'venue' in data:
        if not data['venue'] or len(data['venue']) < 2:
            errors.append('El lugar debe tener al menos 2 caracteres')
        elif not validate_length(data['venue'], 200):
            errors.append('El lugar no puede exceder 200 caracteres')
    
    # Validar ciudad
    if 'city' in data:
        if not data['city'] or len(data['city']) < 2:
            errors.append('La ciudad debe tener al menos 2 caracteres')
        elif not validate_length(data['city'], 100):
            errors.append('La ciudad no puede exceder 100 caracteres')
    
    # Validar URL de entradas
    if 'ticket_url' in data:
        if not data['ticket_url']:
            errors.append('La URL de entradas es requerida')
        elif not validate_url(data['ticket_url']):
            errors.append('La URL de entradas no es válida')
    
    # Validar mensaje
    if 'message' in data and data['message']:
        if not validate_length(data['message'], 1000):
            errors.append('El mensaje no puede exceder 1000 caracteres')
    
    return errors 