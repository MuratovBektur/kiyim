#!/usr/bin/env bash
# Stop then start marketplace in dev mode (production build, .env.dev port).
set -e
cd "$(dirname "$0")"
docker compose --env-file .env.dev -f docker-compose.yml down
docker compose --env-file .env.dev -f docker-compose.yml up -d --build
