#!/usr/bin/env python3
"""
Script para importar venues desde un archivo Excel a la base de datos.
Uso: python scripts/import_venues.py [ruta_al_archivo_excel]

El archivo Excel debe tener las siguientes columnas en este orden:
- Venue (nombre del venue)
- Dirección (dirección del venue)
- Latitud (coordenada latitud)
- Longitud (coordenada longitud)
- Ubicación (descripción de ubicación)

Ejemplos de uso:
- python scripts/import_venues.py venues.xlsx
- python scripts/import_venues.py /ruta/completa/venues.xlsx
"""

import sys
import os
import pandas as pd
import logging
from pathlib import Path
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

# Agregar el directorio padre al path para importar los módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_db, engine
from app.models import Venue
from app.schemas import VenueCreate
from app.crud import bulk_create_venues, get_venues
from dotenv import load_dotenv

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Cargar variables de entorno
load_dotenv()

def validate_excel_file(file_path: str) -> bool:
    """Valida que el archivo Excel existe y tiene el formato correcto"""
    if not os.path.exists(file_path):
        logger.error(f"El archivo {file_path} no existe")
        return False
    
    if not file_path.endswith(('.xlsx', '.xls')):
        logger.error(f"El archivo {file_path} no es un archivo Excel válido (.xlsx o .xls)")
        return False
    
    return True

def read_excel_file(file_path: str) -> pd.DataFrame:
    """Lee el archivo Excel y retorna un DataFrame"""
    try:
        # Leer el archivo Excel
        df = pd.read_excel(file_path)
        logger.info(f"Archivo Excel leído exitosamente. Filas encontradas: {len(df)}")
        
        # Verificar que tiene al menos 5 columnas
        if len(df.columns) < 5:
            logger.error(f"El archivo debe tener al menos 5 columnas. Encontradas: {len(df.columns)}")
            return None
        
        # Renombrar las columnas para que coincidan con nuestro esquema
        column_mapping = {
            df.columns[0]: 'name',      # Venue
            df.columns[1]: 'address',   # Dirección
            df.columns[2]: 'latitude',  # Latitud
            df.columns[3]: 'longitude', # Longitud
            df.columns[4]: 'location'   # Ubicación
        }
        
        df = df.rename(columns=column_mapping)
        
        # Seleccionar solo las columnas que necesitamos
        required_columns = ['name', 'address', 'latitude', 'longitude', 'location']
        df = df[required_columns]
        
        # Limpiar datos
        df = df.dropna(subset=['name', 'address'])  # Eliminar filas sin nombre o dirección
        
        # Convertir coordenadas a float, manejando errores
        for coord_col in ['latitude', 'longitude']:
            df[coord_col] = pd.to_numeric(df[coord_col], errors='coerce')
        
        # Limpiar strings
        for str_col in ['name', 'address', 'location']:
            df[str_col] = df[str_col].astype(str).str.strip()
        
        logger.info(f"Datos procesados. Filas válidas: {len(df)}")
        return df
        
    except Exception as e:
        logger.error(f"Error al leer el archivo Excel: {e}")
        return None

def check_existing_venues(db: Session, venues_data: List[VenueCreate]) -> tuple:
    """Verifica qué venues ya existen en la base de datos"""
    existing_venues = get_venues(db, limit=10000)  # Obtener todos los venues existentes
    existing_names = {venue.name.lower().strip() for venue in existing_venues['items']}
    
    new_venues = []
    duplicates = []
    
    for venue_data in venues_data:
        venue_name_lower = venue_data.name.lower().strip()
        if venue_name_lower in existing_names:
            duplicates.append(venue_data.name)
        else:
            new_venues.append(venue_data)
    
    return new_venues, duplicates

def create_venue_objects(df: pd.DataFrame) -> List[VenueCreate]:
    """Convierte el DataFrame en objetos VenueCreate"""
    venues = []
    
    for _, row in df.iterrows():
        try:
            venue_data = VenueCreate(
                name=str(row['name']),
                address=str(row['address']),
                latitude=float(row['latitude']) if pd.notna(row['latitude']) else None,
                longitude=float(row['longitude']) if pd.notna(row['longitude']) else None,
                location=str(row['location']) if pd.notna(row['location']) else None
            )
            venues.append(venue_data)
        except Exception as e:
            logger.warning(f"Error al procesar fila: {row.to_dict()}. Error: {e}")
            continue
    
    return venues

def import_venues(file_path: str, skip_duplicates: bool = True) -> bool:
    """Función principal para importar venues"""
    logger.info("=== INICIANDO IMPORTACIÓN DE VENUES ===")
    
    # Validar archivo
    if not validate_excel_file(file_path):
        return False
    
    # Leer archivo Excel
    df = read_excel_file(file_path)
    if df is None or len(df) == 0:
        logger.error("No se pudieron leer datos válidos del archivo Excel")
        return False
    
    # Crear objetos VenueCreate
    venues_data = create_venue_objects(df)
    if not venues_data:
        logger.error("No se pudieron crear objetos de venue válidos")
        return False
    
    logger.info(f"Se crearon {len(venues_data)} objetos de venue")
    
    # Conectar a la base de datos
    db = next(get_db())
    
    try:
        # Verificar venues existentes
        new_venues, duplicates = check_existing_venues(db, venues_data)
        
        if duplicates:
            logger.warning(f"Se encontraron {len(duplicates)} venues duplicados:")
            for dup in duplicates[:10]:  # Mostrar solo los primeros 10
                logger.warning(f"  - {dup}")
            if len(duplicates) > 10:
                logger.warning(f"  ... y {len(duplicates) - 10} más")
        
        if not new_venues:
            logger.info("No hay venues nuevos para importar")
            return True
        
        # Importar venues nuevos
        logger.info(f"Importando {len(new_venues)} venues nuevos...")
        
        # Importar en lotes para mejor rendimiento
        batch_size = 100
        total_imported = 0
        
        for i in range(0, len(new_venues), batch_size):
            batch = new_venues[i:i + batch_size]
            try:
                imported_batch = bulk_create_venues(db, batch)
                total_imported += len(imported_batch)
                logger.info(f"Lote {i//batch_size + 1}: {len(imported_batch)} venues importados")
            except IntegrityError as e:
                logger.error(f"Error de integridad en lote {i//batch_size + 1}: {e}")
                continue
            except Exception as e:
                logger.error(f"Error inesperado en lote {i//batch_size + 1}: {e}")
                continue
        
        logger.info(f"=== IMPORTACIÓN COMPLETADA ===")
        logger.info(f"Total de venues importados: {total_imported}")
        logger.info(f"Venues duplicados encontrados: {len(duplicates)}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error durante la importación: {e}")
        return False
    finally:
        db.close()

def main():
    """Función principal del script"""
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    # Verificar que el archivo existe
    if not os.path.exists(file_path):
        logger.error(f"El archivo {file_path} no existe")
        sys.exit(1)
    
    # Ejecutar importación
    success = import_venues(file_path)
    
    if success:
        logger.info("Importación completada exitosamente")
        sys.exit(0)
    else:
        logger.error("La importación falló")
        sys.exit(1)

if __name__ == "__main__":
    main() 