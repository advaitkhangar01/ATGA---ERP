#!/bin/bash
set -e

# Atul Glass Agency ERP - Disaster Recovery Database Restore Script

if [ -z "$1" ]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz>"
  echo "Example: $0 /var/backups/atulglass-db/atulglass_backup_20261115_020000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file '${BACKUP_FILE}' not found."
  exit 1
fi

CONTAINER_NAME="${PG_CONTAINER:-atulglass_postgres}"
APP_CONTAINER="${APP_CONTAINER:-atulglass_app}"
DB_USER="${POSTGRES_USER:-atuladmin}"
DB_NAME="${POSTGRES_DB:-atulglass_db}"

echo "=========================================================="
echo "ATUL GLASS AGENCY ERP - DATABASE RESTORE"
echo "Restoring from: ${BACKUP_FILE}"
echo "Target DB:      ${DB_NAME}"
echo "Container:      ${CONTAINER_NAME}"
echo "=========================================================="
read -p "WARNING: This will overwrite existing database '${DB_NAME}'. Continue? (y/N): " -r CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
  echo "Restore aborted by user."
  exit 0
fi

# 1. Stop app container to block incoming writes
echo "[1/4] Stopping application container to prevent incoming writes..."
docker stop "${APP_CONTAINER}" 2>/dev/null || true

# 2. Terminate active database connections & recreate database
echo "[2/4] Dropping and recreating target database '${DB_NAME}'..."
docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d postgres -c "
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
  DROP DATABASE IF EXISTS ${DB_NAME};
  CREATE DATABASE ${DB_NAME};
"

# 3. Stream uncompressed dump into PostgreSQL
echo "[3/4] Streaming uncompressed backup dump into '${DB_NAME}'..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"

# 4. Restart app container and run healthcheck
echo "[4/4] Restarting application container..."
docker start "${APP_CONTAINER}" 2>/dev/null || true

echo "=========================================================="
echo "RESTORE COMPLETED SUCCESSFULLY at $(date)"
echo "=========================================================="
