# Funcionalidad de Subida de Imágenes a Amazon S3

Esta implementación permite a los administradores subir imágenes de eventos directamente al bucket de Amazon S3 y almacenar las URLs en la base de datos.

## Configuración

### Variables de Entorno

Las siguientes variables de entorno están configuradas en `app/config.py`:

```python
AWS_ACCESS_KEY_ID =
AWS_SECRET_ACCESS_KEY =
AWS_REGION =
S3_BUCKET_NAME =
S3_BUCKET_URL =
```

### Dependencias

Se agregaron las siguientes dependencias a `requirements.txt`:

```
boto3==1.34.0
Pillow==10.1.0
```

## Endpoints Disponibles

### 1. Subida de Imagen Directa

**POST** `/upload/image`

Sube una imagen directamente al bucket de S3.

**Headers requeridos:**
- `Authorization: Bearer <token>` (solo administradores)

**Body (multipart/form-data):**
- `file`: Archivo de imagen (JPEG, PNG, GIF, etc.)

**Respuesta exitosa:**
```json
{
    "success": true,
    "image_url": "https://static-billboard.s3.amazonaws.com/events/2025/01/07/uuid.jpg",
    "message": "Imagen subida exitosamente"
}
```

### 2. Crear Evento con Imagen

**POST** `/events/with-image`

Crea un nuevo evento con subida de imagen incluida.

**Headers requeridos:**
- `Authorization: Bearer <token>` (solo administradores)

**Body (multipart/form-data):**
- `name`: Nombre del evento (requerido)
- `artist`: Artista (requerido)
- `genre`: Género (requerido)
- `date`: Fecha en formato ISO (requerido)
- `location`: Ubicación (requerido)
- `city`: Ciudad (requerido)
- `venue`: Venue (requerido)
- `description`: Descripción (requerido)
- `ticket_url`: URL de tickets (opcional)
- `is_featured`: Si es destacado (opcional, default: false)
- `latitude`: Latitud (opcional)
- `longitude`: Longitud (opcional)
- `date_types`: Array JSON como string (opcional)
- `ticket_price`: Precio del ticket (opcional)
- `image`: Archivo de imagen (opcional)

### 3. Actualizar Evento con Imagen

**PUT** `/events/{event_id}/with-image`

Actualiza un evento existente con opción de cambiar la imagen.

**Headers requeridos:**
- `Authorization: Bearer <token>` (solo administradores)

**Body (multipart/form-data):**
- Todos los campos del evento (opcionales)
- `image`: Nueva imagen (opcional, reemplaza la anterior)

## Características

### Optimización de Imágenes

- **Redimensionamiento automático**: Las imágenes se redimensionan a un máximo de 1920x1080 píxeles
- **Compresión**: Las imágenes JPEG se comprimen con calidad 85%
- **Conversión de formato**: Las imágenes se convierten automáticamente al formato apropiado

### Organización de Archivos

Las imágenes se organizan en S3 con la siguiente estructura:
```
events/
├── 2025/
│   ├── 01/
│   │   ├── 07/
│   │   │   ├── uuid1.jpg
│   │   │   └── uuid2.png
│   │   └── 08/
│   │       └── uuid3.jpg
│   └── 02/
│       └── 15/
│           └── uuid4.jpg
```

### Gestión Automática

- **Eliminación automática**: Cuando se elimina un evento, su imagen se elimina automáticamente de S3
- **Reemplazo de imágenes**: Al actualizar un evento con una nueva imagen, la anterior se elimina automáticamente
- **Validación**: Se valida el tipo de archivo y tamaño (máximo 10MB)

## Ejemplo de Uso

### Frontend (JavaScript/TypeScript)

```javascript
// Crear evento con imagen
const formData = new FormData();
formData.append('name', 'Mi Evento');
formData.append('artist', 'Mi Artista');
formData.append('genre', 'Rock');
formData.append('date', '2025-01-15T20:00:00');
formData.append('location', 'Mi Ubicación');
formData.append('city', 'Mi Ciudad');
formData.append('venue', 'Mi Venue');
formData.append('description', 'Descripción del evento');
formData.append('image', imageFile); // File object

const response = await fetch('/events/with-image', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});

const result = await response.json();
console.log('Evento creado:', result);
console.log('URL de imagen:', result.image_url);
```

### cURL

```bash
# Subir imagen directa
curl -X POST "http://localhost:8000/upload/image" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@mi_imagen.jpg"

# Crear evento con imagen
curl -X POST "http://localhost:8000/events/with-image" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=Mi Evento" \
  -F "artist=Mi Artista" \
  -F "genre=Rock" \
  -F "date=2025-01-15T20:00:00" \
  -F "location=Mi Ubicación" \
  -F "city=Mi Ciudad" \
  -F "venue=Mi Venue" \
  -F "description=Descripción del evento" \
  -F "image=@mi_imagen.jpg"
```

## Pruebas

Para probar la funcionalidad, ejecuta el script de prueba:

```bash
cd backend
python test_s3_upload.py
```

Este script realizará las siguientes pruebas:
1. Login como administrador
2. Subida de imagen directa
3. Creación de evento con imagen
4. Actualización de evento con nueva imagen
5. Eliminación de evento (incluye eliminación de imagen)

## Seguridad

- Solo los administradores pueden subir imágenes
- Se valida el tipo de archivo (solo imágenes)
- Se limita el tamaño de archivo (máximo 10MB)
- Las imágenes se optimizan antes de subir
- Las URLs de S3 son públicas para permitir acceso desde el frontend

## Troubleshooting

### Error de Credenciales AWS
Si recibes errores de credenciales, verifica que las variables de entorno estén configuradas correctamente.

### Error de Permisos S3
Asegúrate de que el bucket tenga los permisos correctos para subir y eliminar archivos.

### Error de Tamaño de Archivo
Si el archivo es muy grande, se rechazará. El límite es de 10MB.

### Error de Tipo de Archivo
Solo se aceptan archivos de imagen (JPEG, PNG, GIF, etc.). 