#!/usr/bin/env bash
# Deploy majalengka.tech di VPS. GitHub Actions memanggilnya lewat SSH dengan kunci yang di authorized_keys dikunci
# ke skrip ini saja (restrict,command="..."). Salinan yang dijalankan ada di luar repo (~/bin/deploy-majalengka-tech),
# supaya push ke repo tidak bisa mengubah skrip deploy-nya sendiri. Perbarui salinan itu dengan tangan bila file ini berubah.
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/majalengka.tech}"
cd "$APP_DIR"
mkdir -p .data
exec > >(tee -a .data/deploy.log) 2>&1

# Satu deploy dalam satu waktu.
exec 9>.data/deploy.lock
flock -n 9 || { echo "Deploy lain masih berjalan. Coba lagi setelah selesai."; exit 1; }

# GitHub Actions mengirim hash commit sebagai SSH_ORIGINAL_COMMAND. Selain hash 40 karakter, isinya diabaikan.
TARGET="${SSH_ORIGINAL_COMMAND:-}"
[[ "$TARGET" =~ ^[0-9a-f]{40}$ ]] || TARGET=""

echo "== $(date -u +%FT%TZ) deploy mulai"
git fetch --quiet origin main
REF="${TARGET:-origin/main}"
git merge-base --is-ancestor "$REF" origin/main || { echo "Commit $REF tidak ada di branch main, deploy dibatalkan."; exit 1; }
PREV=$(git rev-parse HEAD)
git reset --quiet --hard "$REF"
echo "kode: $(git log -1 --format='%h %s')"

# Kunci aplikasi diambil dari Doppler (config prd) bila VPS sudah punya service token untuk folder ini.
# Kalau Doppler tidak bisa dihubungi atau hasilnya tidak lengkap, .env yang ada tetap dipakai.
if command -v doppler >/dev/null && [ -n "$(doppler configure get token --plain --scope "$APP_DIR" 2>/dev/null)" ]; then
	if (umask 077 && doppler secrets download --no-file --format docker --scope "$APP_DIR" > .env.doppler 2>/dev/null) \
		&& grep -q '^NUXT_BETTER_AUTH_SECRET=.' .env.doppler; then
		[ -f .env ] && cp -p .env .data/env-sebelum-doppler.bak
		mv .env.doppler .env
		echo "kunci: diambil dari Doppler ($(grep -c '=' .env) variabel)"
	else
		rm -f .env.doppler
		echo "PERINGATAN: kunci dari Doppler gagal diambil atau tidak lengkap, memakai .env yang ada."
	fi
fi

# Cadangan dulu: migrasi yang sudah jalan tidak ikut kembali saat rollback, jadi cadangan inilah jalan pulangnya.
./scripts/backup-db.sh
docker tag majalengka-tech:latest majalengka-tech:sebelumnya 2>/dev/null || true
docker compose build majalengka-tech
docker compose --profile tools build migrate
docker compose --profile tools run --rm migrate
docker compose up -d majalengka-tech

for _ in $(seq 1 36); do
	STATUS=$(docker inspect -f '{{.State.Health.Status}}' majalengka-tech 2>/dev/null || echo starting)
	if [ "$STATUS" = healthy ]; then
		echo "== $(date -u +%FT%TZ) deploy selesai: $(git rev-parse --short HEAD)"
		docker image prune -f >/dev/null
		exit 0
	fi
	sleep 5
done

echo "Container baru tidak sehat dalam 3 menit. Kembali ke versi sebelumnya ($(git rev-parse --short "$PREV"))."
git reset --quiet --hard "$PREV"
docker tag majalengka-tech:sebelumnya majalengka-tech:latest
docker compose up -d --no-build majalengka-tech
exit 1
