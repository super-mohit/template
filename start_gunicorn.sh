#!/bin/sh

# This script is the entrypoint for the production Docker container.
# It's responsible for applying database migrations and starting the Gunicorn server.

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Running Database Migrations..."
# Run alembic migrations. The 'alembic' command is available in the PATH
# because we've added the virtual environment's bin directory.
alembic upgrade head

echo "Starting Gunicorn Server..."
# Start the Gunicorn server, binding to all interfaces on port 8000.
# The configuration is loaded from the production config file.
gunicorn -c gunicorn/prod.py app.main:app