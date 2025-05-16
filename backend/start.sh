#!/bin/bash

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 30

# Run database migrations
echo "Running database migrations..."
alembic upgrade head || {
    echo "Error running migrations"
    exit 1
}

# Initialize database with sample data
echo "Initializing database with sample data..."
python init_db.py <<< "s" || {
    echo "Error initializing database"
    exit 1
}

# Start the application
echo "Starting application..."
uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1 --log-level debug 