#!/usr/bin/env bash
# Stop then start marketplace in prod mode (production build, .env.prod port).
set -e
cd "$(dirname "$0")"
docker compose --env-file .env.prod -f docker-compose.yml down
docker compose --env-file .env.prod -f docker-compose.yml up -d --build
