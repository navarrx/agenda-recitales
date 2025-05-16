#!/bin/bash

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 30

# Initialize alembic if migrations directory doesn't exist
if [ ! -d "migrations" ]; then
    echo "Initializing alembic..."
    alembic init migrations
fi

# Run database migrations
echo "Running database migrations..."
alembic upgrade head || {
    echo "Error running migrations"
    # Don't exit here, try to continue with the application
}

# Initialize database with sample data
echo "Initializing database with sample data..."
python init_db.py <<< "s" || {
    echo "Error initializing database"
    # Don't exit here, try to continue with the application
}

# Start the application
echo "Starting application..."
uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1 --log-level debug 