#!/usr/bin/env python3
"""
Script simple para resetear la base de datos y ejecutar las migraciones existentes.
Este script es más directo y no crea nuevas migraciones.

Uso:
    python simple_reset_db.py
"""

import sys
import os
import subprocess
from sqlalchemy import text, inspect

# Agregar el directorio del proyecto al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from init_db import create_sample_data

def drop_all_tables():
    """
    Elimina todas las tablas de la base de datos excepto alembic_version.
    """
    print("🗑️  Eliminando todas las tablas existentes...")
    
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    
    # Filtrar para no eliminar alembic_version
    tables_to_drop = [table for table in table_names if table != "alembic_version"]
    
    if not tables_to_drop:
        print("✅ No hay tablas para eliminar.")
        return
    
    print(f"📋 Tablas a eliminar: {', '.join(tables_to_drop)}")
    
    with engine.connect() as connection:
        # Deshabilitar verificaciones de foreign keys temporalmente
        connection.execute(text("SET session_replication_role = replica;"))
        
        for table_name in tables_to_drop:
            try:
                connection.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE;"))
                print(f"✅ Tabla '{table_name}' eliminada.")
            except Exception as e:
                print(f"⚠️  Error al eliminar tabla '{table_name}': {e}")
        
        # Rehabilitar verificaciones de foreign keys
        connection.execute(text("SET session_replication_role = DEFAULT;"))
        connection.commit()
    
    print("✅ Todas las tablas eliminadas exitosamente.")

def reset_alembic_to_base():
    """
    Resetea Alembic a la versión base (antes de cualquier migración).
    """
    print("🔄 Reseteando Alembic a versión base...")
    
    try:
        # Marcar como no migrado
        result = subprocess.run(
            ["alembic", "stamp", "base"],
            cwd=os.path.dirname(os.path.abspath(__file__)),
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Alembic reseteado a versión base.")
        else:
            print(f"❌ Error al resetear Alembic: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error al ejecutar Alembic: {e}")
        return False
    
    return True

def run_migrations():
    """
    Ejecuta todas las migraciones desde el inicio.
    """
    print("🚀 Ejecutando todas las migraciones...")
    
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

def main():
    """
    Función principal.
    """
    print("🔄 RESET SIMPLE DE BASE DE DATOS")
    print("=" * 40)
    
    try:
        # Paso 1: Eliminar todas las tablas
        drop_all_tables()
        print()
        
        # Paso 2: Resetear Alembic
        if not reset_alembic_to_base():
            print("❌ Error al resetear Alembic. Abortando...")
            return
        print()
        
        # Paso 3: Ejecutar migraciones
        if not run_migrations():
            print("❌ Error al ejecutar migraciones. Abortando...")
            return
        print()
        
        # Paso 4: Verificar base de datos
        verify_database()
        print()
        
        # Paso 5: Preguntar si cargar datos de ejemplo
        print("🎉 ¡Base de datos reseteada exitosamente!")
        print()
        
        load_sample_data = input("¿Deseas cargar datos de ejemplo? (s/n): ").lower()
        if load_sample_data in ['s', 'si', 'y', 'yes']:
            print("📊 Cargando datos de ejemplo...")
            create_sample_data()
            print("✅ Datos de ejemplo cargados exitosamente.")
        
        print("\n🎯 ¡Proceso completado exitosamente!")
        
    except Exception as e:
        print(f"❌ Error durante el proceso: {e}")

if __name__ == "__main__":
    main() 