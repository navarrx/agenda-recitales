# Configuración del Archivo de Entorno (.env)

Para configurar correctamente la aplicación Agenda de Recitales, es necesario crear un archivo `.env` en la carpeta `backend/` con las variables de entorno adecuadas.

## Creación del Archivo .env

1. Navega a la carpeta `backend/`
2. Crea un archivo nuevo llamado `.env` (asegúrate de incluir el punto al principio)
3. Añade las siguientes variables con los valores apropiados para tu entorno

## Variables de Entorno Necesarias

```
# Database Configuration
DB_USER=postgres
DB_PASSWORD=tu_contraseña
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agenda_db
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Application Configuration
ADMIN_SECRET=tu_clave_secreta_admin

# CORS Settings (comma-separated list of allowed origins)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Optional: Set to "development" to enable additional debug features
# ENV=development
```

## Descripción de las Variables

### Configuración de Base de Datos
- `DB_USER`: Usuario de PostgreSQL (por defecto: "postgres")
- `DB_PASSWORD`: Contraseña del usuario de PostgreSQL
- `DB_HOST`: Host donde se ejecuta PostgreSQL (por defecto: "localhost")
- `DB_PORT`: Puerto de PostgreSQL (por defecto: "5432")
- `DB_NAME`: Nombre de la base de datos (por defecto: "agenda_db")
- `DATABASE_URL`: URL completa de conexión a la base de datos (se construye automáticamente a partir de las variables anteriores, pero puedes sobrescribirla)

### Configuración de la Aplicación
- `ADMIN_SECRET`: Clave secreta para acceder al panel de administración

### Configuración de CORS
- `ALLOWED_ORIGINS`: Lista de orígenes permitidos para CORS, separados por comas

### Variables Opcionales
- `ENV`: Entorno de ejecución. Si se establece como "development", se habilitarán características adicionales de depuración

## Ejemplo de Archivo .env Completo

```
# Database Configuration
DB_USER=postgres
DB_PASSWORD=micontraseña123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agenda_db

# Application Configuration
ADMIN_SECRET=clave_secreta_admin_123

# CORS Settings
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Environment
ENV=development
```

## Notas Importantes

1. **Nunca compartas tu archivo .env** en control de versiones (Git). Está incluido en el archivo `.gitignore` por defecto.
2. Si estás trabajando en un equipo, comparte un archivo `.env.example` con la estructura pero sin valores sensibles.
3. Para entornos de producción, configura estas variables directamente en tu plataforma de despliegue (Heroku, Railway, etc.). 