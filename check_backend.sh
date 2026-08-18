#!/usr/bin/env bash
set -e

echo "Building backend container..."
docker compose build backend

echo "Starting backend container..."
docker compose up -d backend

echo "Verifying backend python imports..."
docker exec wildlife_backend python -c "import app.main"

echo "Backend import check passed successfully!"
