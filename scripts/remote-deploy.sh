#!/usr/bin/env bash
set -euo pipefail
# Script exécuté sur le serveur via SSH (GitHub Actions appleboy/ssh-action).
# Met à jour l'image et relance la stack ; les secrets (NVIDIA_API_KEY, DATABASE_URL)
# doivent être présents dans /opt/idea-to-action/.env (hors dépôt).

DEPLOY_DIR="${DEPLOY_DIR:-/opt/idea-to-action}"
export APP_IMAGE="${APP_IMAGE:-ghcr.io/OWNER/idea-to-action:latest}"

cd "$DEPLOY_DIR"
docker compose pull app
docker compose up -d --no-build --remove-orphans
docker image prune -f
