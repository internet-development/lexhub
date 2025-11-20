#!/usr/bin/env sh
set -e

echo "Starting LexHub application..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER"; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "PostgreSQL is ready!"

# Run database migrations
echo "Running database migrations..."
npm run db:migrate

echo "Migrations complete! Starting application..."

# Start the Next.js application
exec node .next/standalone/server.js
