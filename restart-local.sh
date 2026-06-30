#!/usr/bin/env bash
# Stop then start marketplace in local mode (hot reload, foreground).
set -e
cd "$(dirname "$0")"
docker compose --env-file .env.local -f docker-compose.yml -f docker-compose.local.yml down
docker compose --env-file .env.local -f docker-compose.yml -f docker-compose.local.yml up --build
