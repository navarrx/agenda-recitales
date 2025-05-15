# Configuración de PostgreSQL para Agenda de Recitales

Este documento proporciona instrucciones sobre cómo configurar PostgreSQL para su uso con la aplicación Agenda de Recitales.

## Instalación de PostgreSQL

### Windows
1. Descarga el instalador de PostgreSQL desde [el sitio oficial](https://www.postgresql.org/download/windows/)
2. Ejecuta el instalador y sigue las instrucciones. Anota la contraseña que configures para el usuario `postgres`.
3. Puedes utilizar pgAdmin (incluido en la instalación) para gestionar la base de datos.

### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

## Configuración de la base de datos

1. Conéctate a PostgreSQL:

   **Windows**: Abre pgAdmin o ejecuta desde el símbolo del sistema:
   ```
   psql -U postgres
   ```

   **macOS/Linux**:
   ```bash
   sudo -u postgres psql
   ```

2. Crea una base de datos para la aplicación:
   ```sql
   CREATE DATABASE agenda_db;
   ```

3. Opcionalmente, puedes crear un usuario específico para la aplicación:
   ```sql
   CREATE USER agenda_user WITH PASSWORD 'tu_contraseña';
   GRANT ALL PRIVILEGES ON DATABASE agenda_db TO agenda_user;
   ```

## Configuración de la aplicación

1. Crea un archivo `.env` en la carpeta `backend/` con el siguiente contenido:

   ```
   DATABASE_URL=postgresql://postgres:tu_contraseña@localhost:5432/agenda_db
   ```

   Si creaste un usuario específico, la URL sería:
   ```
   DATABASE_URL=postgresql://agenda_user:tu_contraseña@localhost:5432/agenda_db
   ```

2. Asegúrate de tener instalado el paquete `psycopg2-binary` (ya incluido en requirements.txt).

## Migración inicial

La primera vez que ejecutes la aplicación, se crearán automáticamente las tablas necesarias en la base de datos. Si quieres inicializar manualmente la estructura:

```bash
cd backend
python -c "from app.database import engine; from app.models import Base; Base.metadata.create_all(bind=engine)"
```

## Solución de problemas

Si encuentras problemas al conectarte a PostgreSQL, verifica:

1. Que PostgreSQL esté en ejecución
2. Que la URL de conexión sea correcta, incluyendo nombre de usuario, contraseña, host y puerto
3. Que la base de datos exista
4. Que el usuario tenga permisos suficientes 