#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Deploy Bumbuket.pku ke tubagus-server via rsync + Docker Compose
# Penggunaan:
#   ./scripts/deploy.sh                          # default: tubagus@192.168.32.100
#   ./scripts/deploy.sh tubagus@100.65.142.66    # via Tailscale
#   WITH_TUNNEL=1 ./scripts/deploy.sh            # sekalian jalankan Cloudflare Tunnel
# ==============================================================================

SERVER="${1:-tubagus@192.168.32.100}"
REMOTE_DIR="${REMOTE_DIR:-/home/tubagus/apps/bumbuket-pku}"
WITH_TUNNEL="${WITH_TUNNEL:-0}"

echo "==> 1. Membuat folder tujuan di ${SERVER}:${REMOTE_DIR} ..."
ssh "${SERVER}" "mkdir -p '${REMOTE_DIR}'"

echo "==> 2. Sinkronisasi source code ke ${SERVER} ..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.turbo' \
  --exclude '.git' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.env.production' \
  ./ "${SERVER}:${REMOTE_DIR}/"

echo "==> 3. Mengecek .env.production di server ..."
if ! ssh "${SERVER}" "test -f '${REMOTE_DIR}/.env.production'"; then
  echo "ERROR: File ${REMOTE_DIR}/.env.production belum ada di server."
  echo "Salin dari .env.production.example lalu isi key Supabase terlebih dahulu:"
  echo "  ssh ${SERVER} \"cp '${REMOTE_DIR}/.env.production.example' '${REMOTE_DIR}/.env.production' && nano '${REMOTE_DIR}/.env.production'\""
  exit 1
fi

echo "==> 4. Build & jalankan container Docker di ${SERVER} (port 3010) ..."
if [ "${WITH_TUNNEL}" = "1" ]; then
  ssh "${SERVER}" "cd '${REMOTE_DIR}' && docker compose --env-file .env.production --profile tunnel up -d --build"
else
  ssh "${SERVER}" "cd '${REMOTE_DIR}' && docker compose --env-file .env.production up -d --build"
fi

echo "==> 5. Status container:"
ssh "${SERVER}" "cd '${REMOTE_DIR}' && docker compose ps"
echo ""
echo "Selesai! Aplikasi berjalan di http://192.168.32.100:3010 (atau domain Cloudflare Tunnel Anda)."

