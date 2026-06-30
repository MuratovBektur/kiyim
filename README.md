# marketplace

Каталог-агрегатор одежды: `backend` (NestJS API) + `frontend` (Nuxt 3) + `nginx`,
объединённые в один docker-compose стек и проксируемые через nginx на одном порту.

```
            ┌────────┐
  :PORT ───►│ nginx  │
            └───┬────┘
       /api/* │       │ /*
        ┌─────▼──┐ ┌──▼──────┐
        │ backend │ │frontend │
        └────┬────┘ └─────────┘
             │ (kiyim-network)
        ┌────▼────┐
        │ postgres│  (проект database/)
        └─────────┘
```

## Три режима

| Режим   | Сборка                          | Hot reload | Порт (по умолчанию) | Файлы |
|---------|----------------------------------|------------|----------------------|-------|
| `local` | `nest --watch` / `nuxt dev`     | да         | 8087 (`.env.local`)  | `docker-compose.yml` + `docker-compose.local.yml` |
| `dev`   | продакшен-сборка (как в prod)   | нет        | 8089 (`.env.dev`)    | `docker-compose.yml` |
| `prod`  | продакшен-сборка                | нет        | 8088 (`.env.prod`)   | `docker-compose.yml` |

`dev` и `prod` используют **один и тот же** `docker-compose.yml` без каких-либо
оверрайдов — единственная разница между запуском `start-dev.sh` и `start-prod.sh`
это `--env-file`, то есть порт. `local` — единственный режим, который реально
отличается по сборке: `docker-compose.local.yml` подставляет `build.target: dev`
и монтирует исходники для hot reload.

```bash
# 1. Сначала должна быть поднята БД (создаёт сеть kiyim-network)
cd ../database && ./start-local.sh   # или start-dev.sh / start-prod.sh

# 2. Запуск marketplace
cd ../marketplace
./start-local.sh   # http://localhost:8087, hot reload
./start-dev.sh      # http://localhost:8089, собранные образы
./start-prod.sh     # http://localhost:8088, собранные образы
```

API доступен на том же порту, что и фронтенд, через `/api/...`.

## Без Docker (как раньше)

`backend/README.md` и `frontend/README.md` описывают локальный запуск через
`npm run start:dev` / `npm run dev` напрямую на хосте, без контейнеров —
удобно для отладки в IDE.
