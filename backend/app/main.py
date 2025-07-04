from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from . import models, auth
from .database import engine, get_db
from .routers import events, auth as auth_router
from .routers import event_requests, upload
from .middleware import add_security_middleware
import os
import logging
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Create initial admin user
db = next(get_db())
try:
    auth.create_initial_admin(db)
    logger.info("Initial admin user created successfully")
except Exception as e:
    logger.error(f"Error creating initial admin user: {e}")

app = FastAPI(
    title="Agenda de Recitales API",
    description="API para la aplicación web de agenda de eventos musicales",
    version="0.1.0"
)

# Agregar middleware de seguridad
add_security_middleware(app)

# Obtener ALLOWED_ORIGINS de variables de entorno o usar valor por defecto
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv(
    "ALLOWED_ORIGINS",
    "https://agenda-recitales-production.up.railway.app"
).split(",")]

# Añadir más orígenes que podrían ser necesarios
if "https://agenda-recitales-production.up.railway.app" not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append("https://agenda-recitales-production.up.railway.app")

# También permitir el dominio backend para pruebas de desarrollo
ALLOWED_ORIGINS.append("https://agenda-recitales-backend-production.up.railway.app")

# Permitir localhost para desarrollo
ALLOWED_ORIGINS.extend(["http://localhost:3000", "http://localhost:5173", "http://localhost:8000"])

# Loguear para depuración
logger.info(f"CORS origins configurados: {ALLOWED_ORIGINS}")
logger.info(f"PORT configurado en la variable de entorno: {os.getenv('PORT', 'No definido')}")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Solo permitir orígenes específicos
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # Cache preflight requests for 24 hours
)

# Middleware para verificar que los headers CORS se estén aplicando
@app.middleware("http")
async def check_cors_headers(request: Request, call_next):
    logger.info(f"Recibida solicitud a: {request.url.path}")
    logger.info(f"Método: {request.method}")
    logger.info(f"Origin: {request.headers.get('origin', 'No origin header')}")
    
    response = await call_next(request)
    
    # Loguear los headers para depuración
    logger.info(f"Response status: {response.status_code}")
    logger.info(f"Response CORS headers: {dict(response.headers)}")
    
    # Si no hay headers CORS y existe un Origin, añadirlos manualmente
    if "access-control-allow-origin" not in response.headers and request.headers.get("origin"):
        origin = request.headers.get("origin")
        logger.info(f"Añadiendo manualmente headers CORS para origen: {origin}")
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
        # Permitir embedding en cualquier sitio
        response.headers["Content-Security-Policy"] = "frame-ancestors *"
    
    return response

# Include routers
app.include_router(events.router)
app.include_router(auth_router.router)
app.include_router(event_requests.router)
app.include_router(upload.router)

# Añadir un endpoint explícito para /events para asegurar que funciona
@app.get("/events")
def read_events_direct(request: Request):
    """Endpoint directo para /events que redirige al router"""
    logger.info(f"GET /events request received directamente en main.py")
    logger.info(f"Redirigiendo a router de events...")
    # Esta función debe redirigir a la implementación en el enrutador
    from .routers.events import read_events_root
    
    # Extraer parámetros de la solicitud
    params = dict(request.query_params)
    skip = int(params.get("skip", 0))
    limit = int(params.get("limit", 100))
    genre = params.get("genre")
    city = params.get("city")
    date_from = params.get("date_from")
    date_to = params.get("date_to")
    search = params.get("search")
    
    # Llamar a la función del enrutador
    return read_events_root(
        request=request,
        skip=skip,
        limit=limit,
        genre=genre,
        city=city,
        date_from=date_from,
        date_to=date_to,
        search=search,
        db=db
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to the Agenda de Recitales API"}

@app.get("/events-test")
def test_events_endpoint():
    """Endpoint para verificar que las rutas GET funcionan correctamente"""
    return {"message": "Events test endpoint is working"}

@app.get("/cors-test")
def test_cors(request: Request):
    """Endpoint para probar que los headers CORS se están aplicando correctamente"""
    origin = request.headers.get("origin", "No origin provided")
    logger.info(f"CORS test called from origin: {origin}")
    return {
        "message": "CORS test successful",
        "request_origin": origin,
        "allowed_origins": ALLOWED_ORIGINS,
        "port": os.getenv("PORT", "No definido")
    }

# Endpoint para verificar CORS
@app.options("/{rest_of_path:path}")
async def options_route(request: Request):
    origin = request.headers.get("origin", "*")
    logger.info(f"Options request from origin: {origin}")
    
    return JSONResponse(
        content={"message": "CORS preflight response"},
        headers={
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

# Definir este archivo como app principal para Railway
app_instance = app

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    logger.info(f"Iniciando servidor en puerto: {port}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)