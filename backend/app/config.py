from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Base de datos
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/agenda")
    
    # JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: list = ["http://localhost:3000", "http://localhost:8000"]
    
    # API
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Agenda API"
    
    class Config:
        case_sensitive = True

settings = Settings() 