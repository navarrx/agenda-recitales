from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
import time
from sqlalchemy.exc import OperationalError

# Load environment variables from .env file
load_dotenv()

# Get database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL")

# If DATABASE_URL is not set, construct it from individual parameters
if not DATABASE_URL:
    DB_USER = os.getenv("POSTGRES_USER")
    DB_PASSWORD = os.getenv("POSTGRES_PASSWORD")
    DB_HOST = os.getenv("POSTGRES_HOST")
    DB_PORT = os.getenv("POSTGRES_PORT")
    DB_NAME = os.getenv("POSTGRES_DB")
    DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"Connecting to database at: {DATABASE_URL}")

# Create engine with connection pool settings and timezone configuration
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # Enable connection health checks
    pool_recycle=300,    # Recycle connections after 5 minutes
    pool_size=5,         # Maximum number of connections to keep
    max_overflow=10,     # Maximum number of connections that can be created beyond pool_size
    echo=True,           # Enable SQL query logging
    #connect_args={
    #    "options": "-c timezone=UTC"
    #}
)

# Test the connection and set timezone
def get_engine():
    max_retries = 5
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            # Test the connection
            with engine.connect() as connection:
                pass
            return engine
        except OperationalError as e:
            if attempt < max_retries - 1:
                print(f"Database connection attempt {attempt + 1} failed. Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                raise e

# Get a working engine
engine = get_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get DB session
def get_db():
    import logging
    logger = logging.getLogger(__name__)
    logger.info("get_db - Iniciando conexión a base de datos...")
    
    db = SessionLocal()
    logger.info("get_db - Sesión de base de datos creada")
    
    try:
        logger.info("get_db - Entregando sesión...")
        yield db
        logger.info("get_db - Sesión entregada correctamente")
    finally:
        logger.info("get_db - Cerrando sesión...")
        db.close() 
        logger.info("get_db - Sesión cerrada") 