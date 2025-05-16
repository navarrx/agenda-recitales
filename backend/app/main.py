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

# Configuración de CORS usando una tupla en lugar de una lista
origins = (
    "https://agenda-recitales-production.up.railway.app",
    "http://localhost:3000",
    "http://localhost:8000"
)

print("=== CORS CONFIGURATION ===")
print(f"Type of origins: {type(origins)}")
print(f"Number of origins: {len(origins)}")
print(f"Origins tuple: {origins}")
print("========================")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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