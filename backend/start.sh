#!/bin/bash
set -e

# Aplicar migraciones automáticamente
alembic upgrade head

# Arrancar el servidor FastAPI
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT 