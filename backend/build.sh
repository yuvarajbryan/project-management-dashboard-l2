#!/usr/bin/env bash

# exit on error
set -o errexit

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Creating static directory..."
mkdir -p static

echo "Collecting static files..."
python manage.py collectstatic --no-input

echo "Running migrations..."
python manage.py migrate

echo "Build completed successfully!"