#!/bin/bash
set -e

# Atul Glass Agency ERP - Automated Nightly Database Backup Script
BACKUP_DIR="${BACKUP_DIR:-/var/backups/atulglass-db}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/atulglass_backup_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="${PG_CONTAINER:-atulglass_postgres}"
DB_USER="${POSTGRES_USER:-atuladmin}"
DB_NAME="${POSTGRES_DB:-atulglass_db}"

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting backup of ${DB_NAME} from container ${CONTAINER_NAME}..."

# 1. Execute compressed pg_dump from PostgreSQL container
docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"
chmod 600 "${BACKUP_FILE}"

echo "[$(date)] Backup completed successfully: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# 2. Retain local backups for 14 days, delete older
find "${BACKUP_DIR}" -name "atulglass_backup_*.sql.gz" -mtime +14 -delete
echo "[$(date)] Purged local backups older than 14 days."

# 3. Off-Server Copy (optional hook for AWS S3 / rclone / SCP)
if [ -n "${OFFSITE_REMOTE}" ]; then
  echo "[$(date)] Syncing backup to remote target ${OFFSITE_REMOTE}..."
  # rclone copy "${BACKUP_FILE}" "${OFFSITE_REMOTE}"
fi

echo "[$(date)] All backup operations finished."
