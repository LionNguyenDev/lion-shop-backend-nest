#!/bin/sh
set -e

echo "Running database migrations..."
node node_modules/.bin/typeorm migration:run -d dist/config/database.js

echo "Starting application..."
exec node dist/main
