"""
Script para migrar la base de datos, agregando las columnas de latitud y longitud.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal
from sqlalchemy import text

def migrate_db():
    """
    Agrega las columnas latitude y longitude a la tabla de eventos.
    """
    print("Migrando la base de datos para agregar coordenadas...")
    
    # Conexión a la base de datos
    db = SessionLocal()
    try:
        # Verificar si las columnas ya existen
        result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'latitude'"))
        latitude_exists = bool(result.fetchone())
        
        result = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'events' AND column_name = 'longitude'"))
        longitude_exists = bool(result.fetchone())
        
        # Agregar columnas si no existen
        if not latitude_exists:
            print("Agregando columna de latitud...")
            db.execute(text("ALTER TABLE events ADD COLUMN latitude FLOAT"))
        else:
            print("La columna de latitud ya existe.")
            
        if not longitude_exists:
            print("Agregando columna de longitud...")
            db.execute(text("ALTER TABLE events ADD COLUMN longitude FLOAT"))
        else:
            print("La columna de longitud ya existe.")
            
        db.commit()
        print("Migración completada exitosamente.")
    except Exception as e:
        db.rollback()
        print(f"Error durante la migración: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_db() 