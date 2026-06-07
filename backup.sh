#!/bin/bash
# =============================================================
#  Digital Meeting Minutes — Database Backup Script
#  Usage:  ./backup.sh
# =============================================================
 
set -e
 
DB_NAME="${POSTGRES_DB:-digital_meeting_minutes}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
BACKUP_DIR="./backups"
 
GREEN='\033[0;32m'
NC='\033[0m'
info() { echo -e "${GREEN}[INFO]${NC}  $1"; }
 
mkdir -p "$BACKUP_DIR"
 
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"
 
export PGPASSWORD="${POSTGRES_PASSWORD}"
 
info "Backing up $DB_NAME → $BACKUP_FILE ..."
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --no-owner --no-acl -f "$BACKUP_FILE"
 
info "✅ Backup saved: $BACKUP_FILE"
 
# Keep only last 7 backups
info "Cleaning old backups (keeping last 7)..."
ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | tail -n +8 | xargs rm -f || true
 
unset PGPASSWORD