#!/usr/bin/env bash
# Dev: identical to prod (production build, no hot reload) — the only
# difference from start-prod.sh is --env-file .env.dev, i.e. the port.
set -e
cd "$(dirname "$0")"
docker compose --env-file .env.dev -f docker-compose.yml up -d --build
