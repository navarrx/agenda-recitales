#!/usr/bin/env python3
"""
Script para resetear completamente la base de datos y ejecutar todas las migraciones desde cero.
Este script es útil cuando hay conflictos de migraciones debido a una base de datos creada manualmente.

Uso:
    python reset_and_migrate_db.py

Este script:
1. Elimina todas las tablas existentes
2. Elimina el historial de migraciones de Alembic
3. Ejecuta todas las migraciones desde el inicio
4. Opcionalmente carga datos de ejemplo
"""

import sys
import os
import subprocess
from sqlalchemy import text, inspect
from sqlalchemy.exc import ProgrammingError

# Agregar el directorio del proyecto al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.models import Event, User, EventRequest
from init_db import create_sample_data

def drop_all_tables():
    """
    Elimina todas las tablas de la base de datos.
    """
    print("🗑️  Eliminando todas las tablas existentes...")
    
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    
    if not table_names:
        print("✅ No hay tablas para eliminar.")
        return
    
    print(f"📋 Tablas encontradas: {', '.join(table_names)}")
    
    with engine.connect() as connection:
        # Deshabilitar verificaciones de foreign keys temporalmente
        connection.execute(text("SET session_replication_role = replica;"))
        
        for table_name in table_names:
            try:
                connection.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE;"))
                print(f"✅ Tabla '{table_name}' eliminada.")
            except Exception as e:
                print(f"⚠️  Error al eliminar tabla '{table_name}': {e}")
        
        # Rehabilitar verificaciones de foreign keys
        connection.execute(text("SET session_replication_role = DEFAULT;"))
        connection.commit()
    
    print("✅ Todas las tablas eliminadas exitosamente.")

def drop_alembic_version_table():
    """
    Elimina la tabla alembic_version si existe.
    """
    print("🗑️  Eliminando tabla alembic_version...")
    
    with engine.connect() as connection:
        try:
            connection.execute(text("DROP TABLE IF EXISTS alembic_version;"))
            connection.commit()
            print("✅ Tabla alembic_version eliminada.")
        except Exception as e:
            print(f"⚠️  Error al eliminar alembic_version: {e}")

def reset_alembic_history():
    """
    Resetea el historial de migraciones de Alembic.
    """
    print("🔄 Reseteando historial de migraciones de Alembic...")
    
    try:
        # Eliminar archivos de migración generados (opcional, comentado por seguridad)
        # import shutil
        # versions_dir = os.path.join("migrations", "versions")
        # if os.path.exists(versions_dir):
        #     for file in os.listdir(versions_dir):
        #         if file.endswith(".py") and file != "__init__.py":
        #             os.remove(os.path.join(versions_dir, file))
        #     print("✅ Archivos de migración eliminados.")
        
        print("✅ Historial de migraciones reseteado.")
    except Exception as e:
        print(f"⚠️  Error al resetear historial: {e}")

def create_initial_migration():
    """
    Crea una nueva migración inicial basada en los modelos actuales.
    """
    print("📝 Creando nueva migración inicial...")
    
    try:
        # Generar nueva migración inicial
        result = subprocess.run(
            ["alembic", "revision", "--autogenerate", "-m", "initial_migration"],
            cwd=os.path.dirname(os.path.abspath(__file__)),
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Nueva migración inicial creada.")
            print(result.stdout)
        else:
            print(f"❌ Error al crear migración: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error al ejecutar Alembic: {e}")
        return False
    
    return True

def run_migrations():
    """
    Ejecuta todas las migraciones pendientes.
    """
    print("🚀 Ejecutando migraciones...")
    
    try:
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            cwd=os.path.dirname(os.path.abspath(__file__)),
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Migraciones ejecutadas exitosamente.")
            print(result.stdout)
        else:
            print(f"❌ Error al ejecutar migraciones: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error al ejecutar Alembic: {e}")
        return False
    
    return True

def verify_database():
    """
    Verifica que las tablas se hayan creado correctamente.
    """
    print("🔍 Verificando estructura de la base de datos...")
    
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    
    expected_tables = ["events", "users", "event_requests", "alembic_version"]
    
    print(f"📋 Tablas encontradas: {', '.join(table_names)}")
    
    for table in expected_tables:
        if table in table_names:
            print(f"✅ Tabla '{table}' existe.")
        else:
            print(f"❌ Tabla '{table}' no encontrada.")
    
    # Verificar columnas de la tabla events
    if "events" in table_names:
        columns = [col['name'] for col in inspector.get_columns("events")]
        print(f"📋 Columnas de 'events': {', '.join(columns)}")

def main():
    """
    Función principal que ejecuta todo el proceso de reset y migración.
    """
    print("🔄 INICIANDO PROCESO DE RESET Y MIGRACIÓN DE BASE DE DATOS")
    print("=" * 60)
    
    try:
        # Paso 1: Eliminar todas las tablas
        drop_all_tables()
        print()
        
        # Paso 2: Eliminar tabla alembic_version
        drop_alembic_version_table()
        print()
        
        # Paso 3: Resetear historial de Alembic
        reset_alembic_history()
        print()
        
        # Paso 4: Crear nueva migración inicial
        if not create_initial_migration():
            print("❌ Error en la creación de migración. Abortando...")
            return
        print()
        
        # Paso 5: Ejecutar migraciones
        if not run_migrations():
            print("❌ Error en la ejecución de migraciones. Abortando...")
            return
        print()
        
        # Paso 6: Verificar base de datos
        verify_database()
        print()
        
        # Paso 7: Preguntar si cargar datos de ejemplo
        print("🎉 ¡Base de datos reseteada y migrada exitosamente!")
        print()
        
        load_sample_data = input("¿Deseas cargar datos de ejemplo? (s/n): ").lower()
        if load_sample_data in ['s', 'si', 'y', 'yes']:
            print("📊 Cargando datos de ejemplo...")
            create_sample_data()
            print("✅ Datos de ejemplo cargados exitosamente.")
        
        print("\n🎯 ¡Proceso completado exitosamente!")
        print("La base de datos está lista para usar.")
        
    except Exception as e:
        print(f"❌ Error durante el proceso: {e}")
        print("🔧 Revisa los logs anteriores para más detalles.")

if __name__ == "__main__":
    main() 