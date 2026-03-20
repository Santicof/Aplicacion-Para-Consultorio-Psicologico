#!/bin/bash
# ============================================
# Backup automático de la base de datos
# Agregar a cron: 0 3 * * * /opt/psique/app/deploy/backup-db.sh
# (Se ejecuta todos los días a las 3AM)
# ============================================

BACKUP_DIR="/opt/psique/backups"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=7

echo "📦 Backup de base de datos - $DATE"

# Crear backup
docker exec psique-postgres pg_dump -U postgres consultorio-psique-turnos | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Eliminar backups viejos (más de 7 días)
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "✅ Backup guardado en $BACKUP_DIR/backup_$DATE.sql.gz"
ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | tail -5
