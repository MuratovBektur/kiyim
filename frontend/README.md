# marketplace/frontend

Nuxt 3 + Tailwind — каталог-агрегатор одежды: поиск, фильтры по категории/продавцу/цене, карточка товара со ссылкой на продавца.

## Запуск

```bash
cp .env.example .env
npm install
npm run dev   # http://localhost:3000
```

> Backend (`marketplace/backend`) должен быть запущен на `http://localhost:3001`.

Это локальный запуск без Docker, для отладки в IDE. Для запуска через Docker
(`local` с hot reload через Vite/`nuxt dev`, либо `dev`/`prod` на собранном
`.output`) см. `../README.md` и `../restart-local.sh` / `../restart-dev.sh` /
`../restart-prod.sh` — фронтенд поднимается вместе с backend и nginx одной
командой (порты 8087/8089/8088 соответственно).
