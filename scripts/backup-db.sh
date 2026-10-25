#!/usr/bin/env bash
# Cadangan harian database SQLite di VPS. Dijalankan dari cron di host, contoh (pukul 03.15 WIB = 20.15 UTC):
#   15 20 * * * /home/ubuntu/majalengka.tech/scripts/backup-db.sh >> /home/ubuntu/majalengka.tech/.data/backups/backup.log 2>&1
# Salinan di disk yang sama tidak menolong kalau VPS hilang. Isi BACKUP_RCLONE_REMOTE (misalnya "r2:majalengkatech-backup/db")
# dan pasang rclone supaya salinannya juga dikirim ke luar server.
set -euo pipefail

CONTAINER="${CONTAINER:-majalengka-tech}"
APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
KEEP_DAYS="${KEEP_DAYS:-14}"
NAME="sqlite-$(date -u +%Y%m%d-%H%M%S).db"

mkdir -p "$APP_DIR/.data/backups"

# VACUUM INTO membuat salinan yang konsisten walaupun aplikasi sedang menulis, tanpa menghentikan container.
docker exec "$CONTAINER" node --no-warnings -e "
const { DatabaseSync } = require('node:sqlite')
const db = new DatabaseSync('/app/.data/db/sqlite.db')
db.exec(\"VACUUM INTO '/app/.data/backups/$NAME'\")
const check = new DatabaseSync('/app/.data/backups/$NAME', { readOnly: true }).prepare('PRAGMA integrity_check').get()
if (Object.values(check)[0] !== 'ok') { console.error('integrity_check gagal', check); process.exit(1) }
"

gzip "$APP_DIR/.data/backups/$NAME"
echo "$(date -u +%FT%TZ) cadangan dibuat: $NAME.gz ($(du -h "$APP_DIR/.data/backups/$NAME.gz" | cut -f1))"

find "$APP_DIR/.data/backups" -name 'sqlite-*.db.gz' -mtime +"$KEEP_DAYS" -delete

if [ -n "${BACKUP_RCLONE_REMOTE:-}" ]; then
	rclone copy "$APP_DIR/.data/backups/$NAME.gz" "$BACKUP_RCLONE_REMOTE"
	echo "$(date -u +%FT%TZ) dikirim ke $BACKUP_RCLONE_REMOTE"
fi
