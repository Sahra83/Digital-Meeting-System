read -p "This will DROP and recreate the database. Continue? (yes/no): " CONFIRM
[ "$CONFIRM" = "yes" ] || { warn "Aborted."; exit 0; }
 
export PGPASSWORD="${POSTGRES_PASSWORD}"
 
# ---- drop & recreate ----
info "Dropping existing database (if any)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='$DB_NAME' AND pid <> pg_backend_pid();" \
  > /dev/null 2>&1 || true
 
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
  -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" \
  > /dev/null 2>&1
 
info "Creating fresh database..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres \
  -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";" \
  > /dev/null 2>&1
 
# ---- restore ----
info "Restoring from $RESTORE_FILE ..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -f "$RESTORE_FILE"
 
info " Restore complete!"
info "Tables restored:"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -c "\dt" 2>/dev/null || true
 
unset PGPASSWORD