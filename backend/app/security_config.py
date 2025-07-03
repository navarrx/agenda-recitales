"""
Configuración de seguridad para la aplicación
"""
import os
from typing import List

# Configuración de CORS
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000"
]

# Configuración de rate limiting
RATE_LIMIT_REQUESTS = 100  # Número de solicitudes por ventana de tiempo
RATE_LIMIT_WINDOW = 60  # Ventana de tiempo en segundos

# Configuración de validación de entrada
MAX_FIELD_LENGTH = 10000  # Longitud máxima de campos
MAX_QUERY_PARAM_LENGTH = 1000  # Longitud máxima de parámetros de consulta
MAX_HEADER_LENGTH = 1000  # Longitud máxima de headers

# Configuración de sanitización
ALLOWED_HTML_TAGS = []  # No permitir HTML
ALLOWED_ATTRIBUTES = []  # No permitir atributos HTML

# Configuración de logging de seguridad
SECURITY_LOG_LEVEL = "WARNING"
LOG_SUSPICIOUS_ACTIVITY = True

# Configuración de headers de seguridad
SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
}

# Patrones de detección de ataques
MALICIOUS_PATTERNS = {
    "sql_injection": [
        r"\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b",
        r"(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+",
        r"(\bOR\b|\bAND\b)\s+['\"]?\w+['\"]?\s*=\s*['\"]?\w+['\"]?",
        r"(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+\s*--",
        r"(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+\s*#",
        r"(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+\s*/\*",
        r"(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+\s*\*/",
    ],
    "xss": [
        r"<script[^>]*>.*?</script>",
        r"<iframe[^>]*>.*?</iframe>",
        r"<object[^>]*>.*?</object>",
        r"<embed[^>]*>.*?</embed>",
        r"javascript:",
        r"vbscript:",
        r"onload\s*=",
        r"onerror\s*=",
        r"onclick\s*=",
        r"onmouseover\s*=",
        r"onfocus\s*=",
        r"onblur\s*=",
    ],
    "path_traversal": [
        r"\.\./",
        r"\.\.\\",
        r"%2e%2e%2f",
        r"%2e%2e%5c",
        r"..%2f",
        r"..%5c",
    ],
    "command_injection": [
        r"[;&|`$()]",
        r"\b(cat|ls|pwd|whoami|id|uname|hostname|ps|netstat|ifconfig|ipconfig)\b",
        r"\b(rm|del|erase|format|fdisk|mkfs)\b",
        r"\b(wget|curl|nc|telnet|ssh|ftp|sftp)\b",
    ]
}

# Configuración de validación de archivos
ALLOWED_FILE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".pdf", ".txt", ".avif"]
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Configuración de autenticación
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Configuración de contraseñas
MIN_PASSWORD_LENGTH = 8
PASSWORD_REQUIREMENTS = {
    "uppercase": True,
    "lowercase": True,
    "numbers": True,
    "special_chars": True
}

# Configuración de sesiones
SESSION_TIMEOUT = 3600  # 1 hora en segundos
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_DURATION = 900  # 15 minutos en segundos

def get_security_config():
    """
    Retorna la configuración de seguridad
    """
    return {
        "allowed_origins": ALLOWED_ORIGINS,
        "rate_limit_requests": RATE_LIMIT_REQUESTS,
        "rate_limit_window": RATE_LIMIT_WINDOW,
        "max_field_length": MAX_FIELD_LENGTH,
        "max_query_param_length": MAX_QUERY_PARAM_LENGTH,
        "max_header_length": MAX_HEADER_LENGTH,
        "security_headers": SECURITY_HEADERS,
        "malicious_patterns": MALICIOUS_PATTERNS,
        "allowed_file_extensions": ALLOWED_FILE_EXTENSIONS,
        "max_file_size": MAX_FILE_SIZE,
        "jwt_secret_key": JWT_SECRET_KEY,
        "jwt_algorithm": JWT_ALGORITHM,
        "access_token_expire_minutes": ACCESS_TOKEN_EXPIRE_MINUTES,
        "min_password_length": MIN_PASSWORD_LENGTH,
        "password_requirements": PASSWORD_REQUIREMENTS,
        "session_timeout": SESSION_TIMEOUT,
        "max_login_attempts": MAX_LOGIN_ATTEMPTS,
        "lockout_duration": LOCKOUT_DURATION
    } 