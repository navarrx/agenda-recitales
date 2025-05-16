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

# Configure CORS
# Get allowed origins from environment variable or use defaults
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
origins = allowed_origins_str.split(",")

# Add production domains
production_domains = [
    "https://agenda-recitales-production.up.railway.app",
    "https://agenda-frontend-production.up.railway.app",
    "https://agenda-recitales-frontend-production.up.railway.app"
]

# Combine all origins
origins.extend(production_domains)

# Remove duplicates and empty strings
origins = list(set(filter(None, origins)))

print("Allowed CORS origins:", origins)

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