#!/usr/bin/env bash
# Local: hot reload (nest --watch / nuxt dev), source bind-mounted, own port.
# This is the only mode whose compose shape differs (docker-compose.local.yml
# swaps the build target and adds volumes) — dev/prod stay byte-identical
# except for --env-file (i.e. the port), per start-dev.sh / start-prod.sh.
set -e
cd "$(dirname "$0")"
docker compose --env-file .env.local -f docker-compose.yml -f docker-compose.local.yml up --build
