#!/usr/bin/env python3
"""
Script para importar eventos desde un archivo Excel a la base de datos.
Uso: python scripts/import_events.py [ruta_al_archivo_excel] [--debug]

El archivo Excel debe tener las siguientes columnas con estos nombres exactos:
- Titulo_Evento (nombre del evento)
- Time (fecha del evento)
- Artista (nombre del artista)
- Venue (nombre del venue)
- Direccion (calle donde se encuentra el venue)
- Latitud (coordenada de latitud del lugar del venue)
- Longitud (coordenada de longitud del lugar del venue)
- Ubicacion (ciudad donde es el venue, ej: CABA)
- Hora (hora del evento en formato hh:mm:ss)
- Link_Ticketera (link de la ticketera)
- URL_Imagen (link del CDN donde está la imagen almacenada)

Ejemplos de uso:
- python scripts/import_events.py eventos.xlsx
- python scripts/import_events.py /ruta/completa/eventos.xlsx
- python scripts/import_events.py eventos.xlsx --debug (para ver información detallada)
"""

import sys
import os
import pandas as pd
import logging
from pathlib import Path
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime

# Agregar el directorio padre al path para importar los módulos de la app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_db, engine
from app.models import Event
from app.schemas import EventCreate
from app.crud import create_event, get_events
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
        logger.info(f"Columnas encontradas: {list(df.columns)}")
        
        # Verificar que tiene las columnas requeridas
        required_columns = [
            'Titulo_Evento',
            'Time',
            'Artista', 
            'Venue',
            'Direccion',
            'Latitud',
            'Longitud',
            'Ubicacion',
            'Hora',
            'Link_Ticketera',
            'URL_Imagen'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            logger.error(f"Faltan las siguientes columnas en el archivo: {missing_columns}")
            logger.error(f"Columnas disponibles: {list(df.columns)}")
            return None
        
        # Renombrar las columnas para que coincidan con nuestro esquema
        column_mapping = {
            'Titulo_Evento': 'name',
            'Time': 'date_str',
            'Artista': 'artist',
            'Venue': 'venue',
            'Direccion': 'location',
            'Latitud': 'latitude',
            'Longitud': 'longitude',
            'Ubicacion': 'city',
            'Hora': 'time_str',
            'Link_Ticketera': 'ticket_url',
            'URL_Imagen': 'image_url'
        }
        
        df = df.rename(columns=column_mapping)
        
        # Seleccionar solo las columnas que necesitamos
        required_columns = ['name', 'date_str', 'artist', 'venue', 'location', 
                           'latitude', 'longitude', 'city', 'time_str', 
                           'ticket_url', 'image_url']
        df = df[required_columns]
        
        # Limpiar datos
        df = df.dropna(subset=['name', 'artist', 'venue', 'city'])  # Eliminar filas sin datos esenciales
        
        # Convertir coordenadas a float, manejando errores
        for coord_col in ['latitude', 'longitude']:
            df[coord_col] = pd.to_numeric(df[coord_col], errors='coerce')
        
        # Limpiar strings (excluyendo date_str y time_str que se manejan por separado)
        for str_col in ['name', 'artist', 'venue', 'location', 'city', 'ticket_url', 'image_url']:
            df[str_col] = df[str_col].astype(str).str.strip()
        
        # Manejar específicamente la columna de hora
        # Si la columna time_str es de tipo datetime.time, convertirla a string con formato HH:MM:SS
        if df['time_str'].dtype == 'object' and hasattr(df['time_str'].iloc[0], 'strftime'):
            # Es un objeto datetime.time, convertir a string
            df['time_str'] = df['time_str'].apply(lambda x: x.strftime('%H:%M:%S') if pd.notna(x) else '')
        else:
            # Es un string, limpiarlo
            df['time_str'] = df['time_str'].astype(str).str.strip()
        
        # Manejar específicamente la columna de fecha
        # Si la columna date_str es de tipo datetime, convertirla a string
        if df['date_str'].dtype == 'object' and hasattr(df['date_str'].iloc[0], 'strftime'):
            # Es un objeto datetime, convertir a string con formato dd/mm/yyyy
            df['date_str'] = df['date_str'].apply(lambda x: x.strftime('%d/%m/%Y') if pd.notna(x) else '')
        else:
            # Es un string, limpiarlo
            df['date_str'] = df['date_str'].astype(str).str.strip()
        
        logger.info(f"Datos procesados. Filas válidas: {len(df)}")
        return df
        
    except Exception as e:
        logger.error(f"Error al leer el archivo Excel: {e}")
        return None

def debug_dataframe(df: pd.DataFrame, max_rows: int = 5):
    """Función de debug para mostrar información del DataFrame"""
    logger.info("=== DEBUG: INFORMACIÓN DEL DATAFRAME ===")
    logger.info(f"Columnas: {list(df.columns)}")
    logger.info(f"Tipos de datos:")
    for col in df.columns:
        logger.info(f"  {col}: {df[col].dtype}")
    
    logger.info(f"\nPrimeras {max_rows} filas:")
    for i in range(min(max_rows, len(df))):
        row = df.iloc[i]
        logger.info(f"Fila {i+1}:")
        for col in df.columns:
            value = row[col]
            logger.info(f"  {col}: '{value}' (tipo: {type(value)})")
        logger.info("")

def combine_date_time(date_str: str, time_str: str) -> Optional[datetime]:
    """Combina fecha y hora en un objeto datetime"""
    try:
        # Limpiar y validar fecha
        if pd.isna(date_str) or str(date_str).strip() == '':
            return None
        
        # Limpiar y validar hora
        if pd.isna(time_str) or str(time_str).strip() == '':
            # Si no hay hora, usar 00:00:00
            time_str = "00:00:00"
        
        # Convertir fecha a string si es necesario
        date_str = str(date_str).strip()
        time_str = str(time_str).strip()
        
        # Log para debug
        logger.debug(f"Procesando fecha: '{date_str}', hora: '{time_str}'")
        
        # Si la hora no tiene segundos, agregarlos
        if len(time_str.split(':')) == 2:
            time_str += ":00"
        
        # Verificar si la fecha ya es un datetime (formato Excel)
        if isinstance(date_str, str) and ' ' in date_str:
            # Es un datetime completo, intentar parsearlo directamente
            datetime_formats = [
                '%Y-%m-%d %H:%M:%S',  # 2025-09-12 00:00:00
                '%Y-%m-%d %H:%M',     # 2025-09-12 00:00
                '%d/%m/%Y %H:%M:%S',  # 8/7/2025 20:00:00
                '%d/%m/%Y %H:%M',     # 8/7/2025 20:00
                '%d-%m-%Y %H:%M:%S',  # 8-7-2025 20:00:00
                '%d-%m-%Y %H:%M',     # 8-7-2025 20:00
            ]
            
            for fmt in datetime_formats:
                try:
                    result = datetime.strptime(date_str, fmt)
                    logger.debug(f"Fecha parseada como datetime completo: {result}")
                    return result
                except ValueError:
                    continue
        
        # Si no es un datetime completo, intentar parsear fecha y hora por separado
        date_formats = [
            '%d/%m/%Y',      # 8/7/2025
            '%d-%m-%Y',      # 8-7-2025
            '%Y-%m-%d',      # 2025-07-08
            '%Y/%m/%d',      # 2025/07/08
            '%d/%m/%y',      # 8/7/25
            '%d-%m-%y',      # 8-7-25
            '%m/%d/%Y',      # 7/8/2025 (formato americano)
            '%m-%d-%Y',      # 7-8-2025 (formato americano)
        ]
        
        parsed_date = None
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(date_str, fmt)
                logger.debug(f"Fecha parseada: {parsed_date}")
                break
            except ValueError:
                continue
        
        if parsed_date is None:
            logger.warning(f"No se pudo parsear la fecha: {date_str}")
            return None
        
        # Ahora parsear la hora
        time_formats = [
            '%H:%M:%S',      # 20:00:00
            '%H:%M',         # 20:00
        ]
        
        parsed_time = None
        for fmt in time_formats:
            try:
                parsed_time = datetime.strptime(time_str, fmt)
                logger.debug(f"Hora parseada: {parsed_time}")
                break
            except ValueError:
                continue
        
        if parsed_time is None:
            logger.warning(f"No se pudo parsear la hora: {time_str}")
            return None
        
        # Combinar fecha y hora
        combined_datetime = parsed_date.replace(
            hour=parsed_time.hour,
            minute=parsed_time.minute,
            second=parsed_time.second
        )
        
        logger.debug(f"Fecha y hora combinadas: {combined_datetime}")
        return combined_datetime
        
    except Exception as e:
        logger.warning(f"Error al combinar fecha y hora: {date_str} {time_str}. Error: {e}")
        return None

def check_existing_events(db: Session, events_data: List[EventCreate]) -> tuple:
    """Verifica qué eventos ya existen en la base de datos"""
    existing_events = get_events(db, limit=10000)  # Obtener todos los eventos existentes
    existing_combinations = set()
    
    for event in existing_events['items']:
        # Crear una clave única basada en nombre, artista, fecha y venue
        key = f"{event.name.lower().strip()}_{event.artist.lower().strip()}_{event.date.strftime('%Y-%m-%d')}_{event.venue.lower().strip()}"
        existing_combinations.add(key)
    
    new_events = []
    duplicates = []
    
    for event_data in events_data:
        key = f"{event_data.name.lower().strip()}_{event_data.artist.lower().strip()}_{event_data.date.strftime('%Y-%m-%d')}_{event_data.venue.lower().strip()}"
        if key in existing_combinations:
            duplicates.append(f"{event_data.name} - {event_data.artist} - {event_data.date.strftime('%Y-%m-%d')}")
        else:
            new_events.append(event_data)
    
    return new_events, duplicates

def create_event_objects(df: pd.DataFrame) -> List[EventCreate]:
    """Convierte el DataFrame en objetos EventCreate"""
    events = []
    
    for index, row in df.iterrows():
        try:
            # Combinar fecha y hora
            combined_datetime = combine_date_time(row['date_str'], row['time_str'])
            if combined_datetime is None:
                logger.warning(f"Fila {index + 2}: No se pudo procesar fecha/hora. Saltando...")
                continue
            
            # Crear el objeto EventCreate
            event_data = EventCreate(
                name=str(row['name']),
                artist=str(row['artist']),
                genre=None,  # Campo opcional, lo dejamos en None
                date=combined_datetime,
                location=str(row['location']),
                city=str(row['city']),
                venue=str(row['venue']),
                description=None,  # Campo opcional, lo dejamos en None
                image_url=str(row['image_url']) if pd.notna(row['image_url']) and str(row['image_url']).strip() != '' else None,
                ticket_url=str(row['ticket_url']) if pd.notna(row['ticket_url']) and str(row['ticket_url']).strip() != '' else None,
                is_featured=False,  # Por defecto no destacado
                latitude=float(row['latitude']) if pd.notna(row['latitude']) else None,
                longitude=float(row['longitude']) if pd.notna(row['longitude']) else None,
                date_types=None,  # Campo opcional
                ticket_price=None  # Campo opcional
            )
            events.append(event_data)
            
        except Exception as e:
            logger.warning(f"Error al procesar fila {index + 2}: {row.to_dict()}. Error: {e}")
            continue
    
    return events

def import_events(file_path: str, skip_duplicates: bool = True) -> bool:
    """Función principal para importar eventos"""
    logger.info("=== INICIANDO IMPORTACIÓN DE EVENTOS ===")
    
    # Validar archivo
    if not validate_excel_file(file_path):
        return False
    
    # Leer archivo Excel
    df = read_excel_file(file_path)
    if df is None or len(df) == 0:
        logger.error("No se pudieron leer datos válidos del archivo Excel")
        return False
    
    # Debug: mostrar información del DataFrame
    debug_dataframe(df)
    
    # Crear objetos EventCreate
    events_data = create_event_objects(df)
    if not events_data:
        logger.error("No se pudieron crear objetos de evento válidos")
        return False
    
    logger.info(f"Se crearon {len(events_data)} objetos de evento")
    
    # Conectar a la base de datos
    db = next(get_db())
    
    try:
        # Verificar eventos existentes
        new_events, duplicates = check_existing_events(db, events_data)
        
        if duplicates:
            logger.warning(f"Se encontraron {len(duplicates)} eventos duplicados:")
            for dup in duplicates[:10]:  # Mostrar solo los primeros 10
                logger.warning(f"  - {dup}")
            if len(duplicates) > 10:
                logger.warning(f"  ... y {len(duplicates) - 10} más")
        
        if not new_events:
            logger.info("No hay eventos nuevos para importar")
            return True
        
        # Importar eventos nuevos
        logger.info(f"Importando {len(new_events)} eventos nuevos...")
        
        # Importar uno por uno para mejor control de errores
        total_imported = 0
        failed_imports = 0
        
        for i, event_data in enumerate(new_events):
            try:
                created_event = create_event(db, event_data)
                total_imported += 1
                if (i + 1) % 50 == 0:  # Log cada 50 eventos
                    logger.info(f"Progreso: {i + 1}/{len(new_events)} eventos importados")
                    
            except IntegrityError as e:
                logger.error(f"Error de integridad al importar evento {i + 1}: {e}")
                failed_imports += 1
                continue
            except Exception as e:
                logger.error(f"Error inesperado al importar evento {i + 1}: {e}")
                failed_imports += 1
                continue
        
        logger.info(f"=== IMPORTACIÓN COMPLETADA ===")
        logger.info(f"Total de eventos importados: {total_imported}")
        logger.info(f"Eventos duplicados encontrados: {len(duplicates)}")
        logger.info(f"Eventos que fallaron al importar: {failed_imports}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error durante la importación: {e}")
        return False
    finally:
        db.close()

def main():
    """Función principal del script"""
    if len(sys.argv) < 2 or len(sys.argv) > 3:
        print(__doc__)
        print("\nOpciones adicionales:")
        print("  --debug: Habilitar logging detallado para debug")
        sys.exit(1)
    
    file_path = sys.argv[1]
    debug_mode = len(sys.argv) == 3 and sys.argv[2] == '--debug'
    
    # Configurar logging según el modo
    if debug_mode:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.info("Modo debug habilitado")
    
    # Verificar que el archivo existe
    if not os.path.exists(file_path):
        logger.error(f"El archivo {file_path} no existe")
        sys.exit(1)
    
    # Ejecutar importación
    success = import_events(file_path)
    
    if success:
        logger.info("Importación completada exitosamente")
        sys.exit(0)
    else:
        logger.error("La importación falló")
        sys.exit(1)

if __name__ == "__main__":
    main() 