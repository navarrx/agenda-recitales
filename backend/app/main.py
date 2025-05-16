from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import models
from .database import engine
from .routers import events
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Agenda de Recitales API",
    description="API para la aplicación web de agenda de eventos musicales",
    version="0.1.0"
)

# Parse allowed origins from environment variable
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

print("Allowed CORS origins:", origins)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,              # ✅ Orígenes permitidos
    allow_credentials=True,
    allow_methods=["*"],                # ✅ Todos los métodos (GET, POST, etc.)
    allow_headers=["*"],                # ✅ Todos los headers
    expose_headers=["*"]
)

# Include routers
app.include_router(events.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Agenda de Recitales API"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)