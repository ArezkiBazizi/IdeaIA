#!/bin/sh
set -e
# Applique les migrations avant démarrage (idempotent en production).
npx prisma migrate deploy
exec "$@"
