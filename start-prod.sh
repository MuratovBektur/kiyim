#!/usr/bin/env bash
# Prod: production build, no hot reload — identical to dev mode apart from
# --env-file .env.prod, i.e. the port (see start-dev.sh).
set -e
cd "$(dirname "$0")"
docker compose --env-file .env.prod -f docker-compose.yml up -d --build
