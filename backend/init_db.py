"""
Script para inicializar la base de datos y opcionalmente cargar datos de prueba.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base
from app.models import Event
from datetime import datetime, timedelta
import random

def init_db():
    """
    Crea las tablas en la base de datos.
    """
    print("Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("¡Tablas creadas exitosamente!")

def create_sample_data():
    """
    Crea datos de ejemplo en la base de datos.
    """
    from sqlalchemy.orm import Session
    from app.database import SessionLocal

    # Datos de ejemplo
    genres = ["Rock", "Pop", "Jazz", "Electrónica", "Hip Hop", "Clásica", "Reggae", "Metal", "Folk"]
    cities = ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "Mar del Plata", "Salta"]
    
    # Venues con coordenadas (latitud, longitud)
    venues = {
        "Buenos Aires": [
            {"name": "Teatro Gran Rex", "lat": -34.6037, "lon": -58.3816},
            {"name": "Luna Park", "lat": -34.6020, "lon": -58.3686},
            {"name": "Estadio Obras", "lat": -34.5454, "lon": -58.4386},
            {"name": "Movistar Arena", "lat": -34.6261, "lon": -58.3847},
            {"name": "Niceto Club", "lat": -34.5879, "lon": -58.4328}
        ],
        "Córdoba": [
            {"name": "Quality Espacio", "lat": -31.4189, "lon": -64.1888},
            {"name": "Plaza de la Música", "lat": -31.4114, "lon": -64.1926},
            {"name": "Estadio Kempes", "lat": -31.3679, "lon": -64.2746}
        ],
        "Rosario": [
            {"name": "Metropolitano", "lat": -32.9449, "lon": -60.6536},
            {"name": "Sala Lavardén", "lat": -32.9414, "lon": -60.6326},
            {"name": "Teatro El Círculo", "lat": -32.9436, "lon": -60.6300}
        ],
        "Mendoza": [
            {"name": "Arena Maipú", "lat": -32.9887, "lon": -68.7858},
            {"name": "Teatro Independencia", "lat": -32.8889, "lon": -68.8397}
        ],
        "La Plata": [
            {"name": "Estadio Único", "lat": -34.9128, "lon": -57.9856},
            {"name": "Teatro Argentino", "lat": -34.9214, "lon": -57.9553}
        ],
        "Mar del Plata": [
            {"name": "Teatro Colón", "lat": -38.0033, "lon": -57.5578},
            {"name": "Estadio Polideportivo", "lat": -38.0175, "lon": -57.5482}
        ],
        "Salta": [
            {"name": "Teatro Provincial", "lat": -24.7904, "lon": -65.4106},
            {"name": "Microestadio Delmi", "lat": -24.7837, "lon": -65.3957}
        ]
    }
    
    artists = [
        "Los Espíritus", "Miranda!", "David Lebón", "Duki", "Tini", "Massacre", "La Renga", 
        "Fito Páez", "Divididos", "Cazzu", "Virus", "El Mató a un Policía Motorizado",
        "Babasónicos", "Soda Stereo Sinfónico", "Conociendo Rusia", "Lisandro Aristimuño",
        "Wos", "Lali", "Indio Solari y los Fundamentalistas", "Eruca Sativa"
    ]
    
    events = []
    now = datetime.now()
    
    # Crear eventos para los próximos 6 meses
    for i in range(20):
        days_ahead = random.randint(7, 180)
        event_date = now + timedelta(days=days_ahead)
        
        # Selección aleatoria de datos
        city = random.choice(cities)
        venue_data = random.choice(venues[city])
        venue_name = venue_data["name"]
        latitude = venue_data["lat"]
        longitude = venue_data["lon"]
        genre = random.choice(genres)
        artist = random.choice(artists)
        
        # Crear evento
        event = Event(
            name=f"Concierto en {city}",
            artist=artist,
            genre=genre,
            date=event_date,
            location=f"Dirección de {venue_name}, {city}",
            city=city,
            venue=venue_name,
            description=f"Disfruta de {artist} en un show imperdible en {venue_name}. Presentando sus mejores éxitos y nuevas canciones.",
            image_url=None,
            ticket_url=f"https://entradas.com/{artist.lower().replace(' ', '-')}",
            is_featured=random.choice([True, False]) if i < 5 else False,
            latitude=latitude,
            longitude=longitude
        )
        events.append(event)
    
    # Guardar eventos en la base de datos
    db = SessionLocal()
    try:
        for event in events:
            db.add(event)
        db.commit()
        print(f"¡{len(events)} eventos de ejemplo creados exitosamente!")
    except Exception as e:
        db.rollback()
        print(f"Error al crear eventos de ejemplo: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    
    # Preguntar si se quieren crear datos de ejemplo
    create_samples = input("¿Deseas crear datos de ejemplo? (s/n): ").lower()
    if create_samples == 's' or create_samples == 'si' or create_samples == 'y' or create_samples == 'yes':
        create_sample_data()
    
    print("Inicialización de la base de datos completada.") 