from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from . import models
from .database import engine
from .routers import events
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

app = FastAPI(
    title="Agenda de Recitales API",
    description="API para la aplicación web de agenda de eventos musicales",
    version="0.1.0"
)

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

# Loguear para depuración
logger.info(f"CORS origins configurados: {ALLOWED_ORIGINS}")
logger.info(f"PORT configurado en la variable de entorno: {os.getenv('PORT', 'No definido')}")

# Configure CORS - asegúrate de que esto se haga antes de incluir los routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
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
        if origin in ALLOWED_ORIGINS or "*" in ALLOWED_ORIGINS:
            logger.info(f"Añadiendo manualmente headers CORS para origen: {origin}")
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

# Include routers
app.include_router(events.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Agenda de Recitales API"}

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