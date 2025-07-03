# Seguridad de la Aplicación

Este documento describe las medidas de seguridad implementadas en la aplicación de Agenda de Recitales.

## Medidas de Seguridad Implementadas

### 1. Frontend (React/TypeScript)

#### Sanitización de Datos
- **Archivo**: `frontend/src/utils/security.ts`
- **Funciones implementadas**:
  - `sanitizeText()`: Remueve caracteres peligrosos y patrones maliciosos
  - `sanitizeEmail()`: Sanitiza emails manteniendo formato válido
  - `sanitizeUrl()`: Sanitiza URLs manteniendo formato válido
  - `validateEmail()`: Valida formato de email
  - `validateUrl()`: Valida formato de URL
  - `validateLength()`: Valida longitud de campos
  - `validateFutureDate()`: Valida que fechas sean futuras

#### Validación en Tiempo Real
- **Archivo**: `frontend/src/components/modals/EventRequestModal.tsx`
- **Características**:
  - Validación de campos en tiempo real
  - Mensajes de error específicos por campo
  - Sanitización automática durante la entrada
  - Prevención de envío con datos inválidos

#### Buscador de Eventos
- **Archivo**: `frontend/src/components/events/EventFilters.tsx`
- **Características**:
  - Sanitización automática del campo de búsqueda
  - Validación de longitud máxima (100 caracteres)
  - Mensajes de advertencia cuando se remueven caracteres peligrosos
  - Límite de caracteres en el input (`maxLength`)

#### Patrones de Detección
- Caracteres peligrosos: `< > " ' &`
- Patrones de SQL injection: `union`, `select`, `insert`, etc.
- Patrones de XSS: `<script>`, `<iframe>`, `javascript:`, etc.

### 2. Backend (FastAPI/Python)

#### Middleware de Seguridad
- **Archivo**: `backend/app/middleware.py`
- **Funcionalidades**:
  - Validación de headers HTTP
  - Validación de parámetros de consulta
  - Validación de cuerpo de solicitudes
  - Detección de patrones maliciosos
  - Logging de actividades sospechosas

#### Utilidades de Seguridad
- **Archivo**: `backend/app/security.py`
- **Funciones implementadas**:
  - `sanitize_text()`: Sanitización de texto con límites de longitud
  - `sanitize_email()`: Sanitización de emails
  - `sanitize_url()`: Sanitización de URLs
  - `validate_email()`: Validación de formato de email
  - `validate_url()`: Validación de formato de URL
  - `validate_future_date()`: Validación de fechas futuras
  - `escape_html()`: Escape de caracteres HTML

#### Validación de Esquemas (Pydantic)
- **Archivo**: `backend/app/schemas.py`
- **Características**:
  - Validadores personalizados para cada campo
  - Límites de longitud configurados
  - Validación de formato de email y URL
  - Validación de fechas futuras
  - Sanitización automática de datos

#### Router de Eventos
- **Archivo**: `backend/app/routers/events.py`
- **Características**:
  - Sanitización del parámetro de búsqueda antes del procesamiento
  - Logging de parámetros sanitizados para auditoría
  - Validación de longitud máxima en el CRUD
  - Uso de parámetros preparados de SQLAlchemy

#### Configuración de Seguridad
- **Archivo**: `backend/app/security_config.py`
- **Configuraciones**:
  - Headers de seguridad HTTP
  - Patrones de detección de ataques
  - Límites de tamaño de archivos
  - Configuración de CORS
  - Configuración de autenticación

### 3. Tipos de Ataques Prevenidos

#### Inyección SQL
- **Detección**: Patrones de palabras clave SQL
- **Prevención**: Sanitización de caracteres especiales
- **Validación**: Esquemas Pydantic con validadores

#### Cross-Site Scripting (XSS)
- **Detección**: Patrones de tags HTML maliciosos
- **Prevención**: Escape de caracteres HTML
- **Validación**: Headers de seguridad HTTP

#### Path Traversal
- **Detección**: Patrones de navegación de directorios
- **Prevención**: Validación de rutas de archivos
- **Validación**: Límites de acceso a archivos

#### Command Injection
- **Detección**: Patrones de comandos del sistema
- **Prevención**: Sanitización de caracteres especiales
- **Validación**: Lista blanca de comandos permitidos

### 4. Headers de Seguridad HTTP

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
```

### 5. Validaciones Implementadas

#### Campos de Texto
- Longitud mínima: 2 caracteres
- Longitud máxima: 100-200 caracteres (según campo)
- Caracteres prohibidos: `< > " ' &`
- Patrones prohibidos: SQL injection, XSS

#### Campo de Búsqueda
- Longitud máxima: 100 caracteres
- Sanitización automática de caracteres peligrosos
- Validación en frontend y backend
- Logging de parámetros sanitizados
- Uso de parámetros preparados en SQL

#### Email
- Formato válido: `usuario@dominio.com`
- Conversión a minúsculas
- Remoción de espacios

#### URL
- Formato válido: `http://` o `https://`
- Dominio válido o IP
- Remoción de espacios

#### Fecha
- Formato ISO válido
- Debe ser fecha futura
- Validación de zona horaria

### 6. Logging de Seguridad

- Registro de actividades sospechosas
- Logging de intentos de ataques
- Nivel de log configurable
- Información de contexto para auditoría

### 7. Configuración de CORS

- Orígenes permitidos configurados
- Métodos HTTP permitidos
- Headers permitidos
- Credenciales habilitadas

### 8. Rate Limiting

- Límite de solicitudes por ventana de tiempo
- Configuración flexible
- Prevención de ataques de fuerza bruta

## Uso de las Utilidades de Seguridad

### Frontend

```typescript
import { sanitizeEventRequest, validateEmail } from '../utils/security';

// Sanitizar y validar datos del formulario
const { sanitized, errors } = sanitizeEventRequest(formData);

if (errors.length > 0) {
  // Mostrar errores al usuario
  setErrors(errors);
  return;
}

// Enviar datos sanitizados
await createEventRequest(sanitized);
```

### Backend

```python
from app.security import sanitize_event_request_data, validate_event_request_data

# Sanitizar datos
sanitized_data = sanitize_event_request_data(request_data)

# Validar datos
validation_errors = validate_event_request_data(sanitized_data)

if validation_errors:
    raise HTTPException(status_code=400, detail={"errors": validation_errors})
```

## Recomendaciones de Seguridad

1. **Mantener actualizadas las dependencias**
2. **Revisar logs de seguridad regularmente**
3. **Monitorear intentos de ataques**
4. **Realizar auditorías de seguridad periódicas**
5. **Configurar HTTPS en producción**
6. **Implementar autenticación de dos factores**
7. **Realizar backups regulares**
8. **Documentar incidentes de seguridad**

## Contacto de Seguridad

Para reportar vulnerabilidades de seguridad, contactar al equipo de desarrollo.

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0.0 