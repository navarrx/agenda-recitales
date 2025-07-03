# Funcionalidad de Subida de Imágenes - Frontend

Esta documentación explica cómo funciona la nueva funcionalidad de subida de imágenes en el frontend de la aplicación de agenda de eventos.

## Características Implementadas

### ✅ Subida de Archivos
- **Campo de archivo**: Reemplazó el campo de URL de imagen con un input de tipo `file`
- **Validación**: Valida tipo de archivo (solo imágenes) y tamaño (máximo 10MB)
- **Vista previa**: Muestra una vista previa de la imagen seleccionada
- **Imagen actual**: Muestra la imagen actual del evento si existe

### ✅ Integración con Backend
- **Endpoints automáticos**: Usa `/events/with-image` para crear y `/events/{id}/with-image` para actualizar
- **FormData**: Envía los datos del formulario como `multipart/form-data`
- **Autenticación**: Incluye el token de autorización automáticamente

### ✅ Experiencia de Usuario
- **Drag & Drop visual**: Interfaz intuitiva para seleccionar archivos
- **Feedback visual**: Muestra el estado de selección y validación
- **Información**: Modal con detalles sobre la funcionalidad

## Cómo Funciona

### 1. Selección de Imagen
```typescript
const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }
    
    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo es demasiado grande. Máximo 10MB permitido.');
      return;
    }
    
    setImageFile(file);
    setError(null);
  }
};
```

### 2. Envío del Formulario
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  // Si hay una imagen seleccionada, usar el endpoint con imagen
  if (imageFile) {
    const formDataToSend = new FormData();
    
    // Agregar todos los campos del formulario
    formDataToSend.append('name', formData.name);
    formDataToSend.append('artist', formData.artist);
    // ... otros campos
    
    // Agregar la imagen
    formDataToSend.append('image', imageFile);
    
    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    if (isEditMode) {
      const response = await fetch(`${baseUrl}/events/${id}/with-image`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
    } else {
      const response = await fetch(`${baseUrl}/events/with-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
    }
  } else {
    // Si no hay imagen, usar los endpoints originales
    if (isEditMode) {
      await updateEvent(parseInt(id, 10), formData);
    } else {
      await createEvent(formData);
    }
  }
};
```

## Componentes Modificados

### EventFormPage.tsx
- **Estado**: Agregado `imageFile` para manejar el archivo seleccionado
- **Validación**: Función `handleImageChange` para validar archivos
- **UI**: Campo de subida de archivo con vista previa
- **Lógica**: Envío condicional según si hay imagen o no

### Campos del Formulario
```tsx
{/* Campo de subida de archivo */}
<input
  type="file"
  accept="image/*"
  onChange={handleImageChange}
  className="hidden"
  id="image-upload"
/>
<label
  htmlFor="image-upload"
  className="w-full px-4 py-3 border-2 border-dashed border-white/20 bg-[#101119] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a48c4]/50 focus:border-[#1a48c4] text-white/70 hover:text-white hover:border-white/40 transition-all duration-200 cursor-pointer flex items-center justify-center"
>
  {imageFile ? (
    <div className="text-center">
      <div className="text-green-400 mb-1">✓ Imagen seleccionada</div>
      <div className="text-sm">{imageFile.name}</div>
    </div>
  ) : (
    <div className="text-center">
      <div className="text-2xl mb-2">📸</div>
      <div>Haz clic para seleccionar una imagen</div>
      <div className="text-xs mt-1">JPEG, PNG, GIF (máx. 10MB)</div>
    </div>
  )}
</label>
```

## Flujo de Trabajo

### Crear Nuevo Evento
1. Usuario llena el formulario
2. Selecciona una imagen (opcional)
3. Al hacer clic en "Guardar Evento":
   - Si hay imagen: Se envía a `/events/with-image` con FormData
   - Si no hay imagen: Se envía a `/events` con JSON
4. El backend sube la imagen a S3 y guarda la URL
5. Se redirige al usuario a la página de administración

### Editar Evento Existente
1. Usuario carga el formulario con datos existentes
2. Ve la imagen actual del evento
3. Puede seleccionar una nueva imagen (opcional)
4. Al guardar:
   - Si hay nueva imagen: Se envía a `/events/{id}/with-image`
   - Si no hay nueva imagen: Se envía a `/events/{id}`
5. El backend elimina la imagen anterior y sube la nueva

## Validaciones

### Frontend
- **Tipo de archivo**: Solo acepta `image/*`
- **Tamaño**: Máximo 10MB
- **Feedback**: Muestra errores en tiempo real

### Backend
- **Tipo de archivo**: Valida que sea imagen
- **Tamaño**: Máximo 10MB
- **Optimización**: Redimensiona y comprime automáticamente
- **Almacenamiento**: Sube a Amazon S3

## Variables de Entorno

Asegúrate de que esté configurada la variable de entorno:

```env
VITE_API_URL=https://tu-backend-url.com
```

## Compatibilidad

### Navegadores Soportados
- Chrome 76+
- Firefox 69+
- Safari 13+
- Edge 79+

### Formatos de Imagen
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)

## Troubleshooting

### Error: "El archivo es demasiado grande"
- Verifica que el archivo sea menor a 10MB
- Comprime la imagen antes de subirla

### Error: "Por favor selecciona un archivo de imagen válido"
- Asegúrate de que el archivo sea una imagen
- Verifica la extensión del archivo

### Error de red al subir
- Verifica la conexión a internet
- Confirma que el backend esté funcionando
- Revisa la variable `VITE_API_URL`

### Imagen no se muestra después de subir
- Verifica que la URL de S3 sea accesible
- Confirma que el bucket tenga permisos públicos
- Revisa la consola del navegador para errores CORS 