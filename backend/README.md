# marketplace/backend

NestJS API каталога-агрегатора одежды. Читает товары/продавцов/категории из БД проекта `database` (та же `DATABASE_URL`).

## Запуск

```bash
cp .env.example .env
npm install
npx prisma generate
npm run start:dev   # http://localhost:3001
```

> БД должна быть поднята и засеяна (см. `database/README.md`) до запуска backend.

Это локальный запуск без Docker, для отладки в IDE. Для запуска через Docker
(`local` с hot reload через `nest --watch`, либо `dev`/`prod` на собранном `dist`)
см. `../README.md` и `../restart-local.sh` / `../restart-dev.sh` / `../restart-prod.sh` —
там backend поднимается вместе с frontend и nginx одной командой.

## Эндпоинты

- `GET /products?search=&categorySlug=&sellerSlug=&minPrice=&maxPrice=&sort=price_asc|price_desc|newest&page=&limit=`
- `GET /products/:id`
- `GET /sellers`
- `GET /categories`
