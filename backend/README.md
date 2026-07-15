# marketplace/backend

NestJS API каталога-агрегатора одежды + Telegram-бот управления каталогом.
Схема, миграции (TypeORM) и сид — здесь же (`src/data-source.ts`,
`src/migrations/`, `src/database/seed.ts`); Postgres поднимается отдельно
проектом `database` (та же `DATABASE_URL`).

## Запуск

```bash
cp .env.example .env
npm install
npm run migration:run && npm run seed
npm run start:dev   # http://localhost:3001
```

> Postgres должен быть поднят (см. `database/README.md`) до запуска backend.

## Полезные команды

```bash
npm run migration:generate -- src/migrations/SomeName   # сгенерировать миграцию из изменений в entities
npm run migration:run                                    # применить миграции
npm run migration:revert                                 # откатить последнюю
npm run seed                                              # засеять тестовыми продавцами/товарами
```

Это локальный запуск без Docker, для отладки в IDE. Для запуска через Docker
(`local` с hot reload через `nest --watch`, либо `dev`/`prod` на собранном `dist`)
см. `../README.md` и `../restart-local.sh` / `../restart-dev.sh` / `../restart-prod.sh` —
там backend поднимается вместе с frontend и nginx одной командой.

## Эндпоинты

- `GET /products?search=&categorySlug=&sellerSlug=&minPrice=&maxPrice=&sort=price_asc|price_desc|newest&page=&limit=`
- `GET /products/:id`
- `GET /sellers`
- `GET /categories`
