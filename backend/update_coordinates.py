"""
Script para actualizar las coordenadas de eventos existentes en la base de datos.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import Event
from sqlalchemy.orm import Session

# Definir coordenadas para los venues conocidos
venue_coordinates = {
    # Buenos Aires
    "Teatro Gran Rex": (-34.6037, -58.3816),
    "Luna Park": (-34.6020, -58.3686),
    "Estadio Obras": (-34.5454, -58.4386),
    "Movistar Arena": (-34.6261, -58.3847),
    "Niceto Club": (-34.5879, -58.4328),
    
    # Córdoba
    "Quality Espacio": (-31.4189, -64.1888),
    "Plaza de la Música": (-31.4114, -64.1926),
    "Estadio Kempes": (-31.3679, -64.2746),
    
    # Rosario
    "Metropolitano": (-32.9449, -60.6536),
    "Sala Lavardén": (-32.9414, -60.6326),
    "Teatro El Círculo": (-32.9436, -60.6300),
    
    # Mendoza
    "Arena Maipú": (-32.9887, -68.7858),
    "Teatro Independencia": (-32.8889, -68.8397),
    
    # La Plata
    "Estadio Único": (-34.9128, -57.9856),
    "Teatro Argentino": (-34.9214, -57.9553),
    
    # Mar del Plata
    "Teatro Colón": (-38.0033, -57.5578),
    "Estadio Polideportivo": (-38.0175, -57.5482),
    
    # Salta
    "Teatro Provincial": (-24.7904, -65.4106),
    "Microestadio Delmi": (-24.7837, -65.3957)
}

# Coordenadas predeterminadas por ciudad (para venues no reconocidos)
city_coordinates = {
    "Buenos Aires": (-34.6037, -58.3816),
    "Córdoba": (-31.4167, -64.1833),
    "Rosario": (-32.9442, -60.6505),
    "Mendoza": (-32.8908, -68.8272),
    "La Plata": (-34.9214, -57.9544),
    "Mar del Plata": (-38.0000, -57.5500),
    "Salta": (-24.7829, -65.4232)
}

def update_coordinates():
    """
    Actualiza las coordenadas de eventos existentes basadas en el venue o la ciudad.
    """
    print("Actualizando coordenadas de eventos existentes...")
    
    # Conexión a la base de datos
    db = SessionLocal()
    try:
        # Obtener todos los eventos con coordenadas nulas
        events = db.query(Event).filter(Event.latitude == None).all()
        
        print(f"Encontrados {len(events)} eventos sin coordenadas.")
        
        updated_count = 0
        for event in events:
            # Intentar asignar coordenadas basadas en el venue
            if event.venue in venue_coordinates:
                lat, lon = venue_coordinates[event.venue]
                event.latitude = lat
                event.longitude = lon
                updated_count += 1
                continue
                
            # Si no se encuentra el venue, usar coordenadas de la ciudad
            if event.city in city_coordinates:
                lat, lon = city_coordinates[event.city]
                event.latitude = lat
                event.longitude = lon
                updated_count += 1
                continue
                
            # Si no se encuentra ni venue ni ciudad, usar coordenadas predeterminadas de Buenos Aires
            event.latitude = -34.6037
            event.longitude = -58.3816
            updated_count += 1
            
        db.commit()
        print(f"Se actualizaron {updated_count} eventos con coordenadas.")
    except Exception as e:
        db.rollback()
        print(f"Error durante la actualización: {e}")
    finally:
        db.close()
        
if __name__ == "__main__":
    update_coordinates() 