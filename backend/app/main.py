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
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://agenda-recitales-production.up.railway.app"
).split(",")

# Loguear para depuración
logger.info(f"CORS origins configurados: {ALLOWED_ORIGINS}")

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
    response = await call_next(request)
    # Loguear los headers para depuración
    logger.info(f"Request origin: {request.headers.get('origin', 'No origin header')}")
    logger.info(f"Response CORS headers: {dict(response.headers)}")
    return response

# Include routers
app.include_router(events.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Agenda de Recitales API"}

# Endpoint para verificar CORS
@app.options("/{rest_of_path:path}")
async def options_route(request: Request):
    return JSONResponse(
        content={"message": "CORS preflight response"},
        headers={
            "Access-Control-Allow-Origin": request.headers.get("origin", "*"),
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)