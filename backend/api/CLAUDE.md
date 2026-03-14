# Backend API

Cloudflare Workers API на Hono.

## Стек

- **Runtime:** Cloudflare Workers
- **Framework:** Hono v4
- **Validation:** Zod v4
- **DB:** Supabase (PostgreSQL) через `@supabase/supabase-js`
- **Auth:** JWT + bcryptjs

## Структура

```
src/
  index.ts              — Точка входа, CORS, роутинг
  middleware/auth.ts     — requireAdmin (cookie admin_token → Supabase verify)
  routes/
    public/             — Публичные эндпоинты (продукты, заказы)
    admin/              — Защищённые CRUD (stock, categories, orders)
    auth/login.ts       — Логин
    telegram/webhook.ts — Telegram бот
  schemes/              — Zod-схемы валидации
  utils/                — Утилиты (Supabase client)
```

## Команды

- `npx wrangler dev` — dev-сервер (порт 3333)
- `npx wrangler deploy` — деплой на Cloudflare

## Конфигурация

- `wrangler.toml` — конфиг Cloudflare Worker
- `.dev.vars` / `.dev.vars.local` — env-переменные (SUPABASE_URL, ключи, JWT_SECRET)

## CORS

- `/api/admin/*` — localhost:4200 (GET, POST, PUT, DELETE)
- `/api/auth/*` — localhost:4200 (POST)
- `/api/public/*` — localhost:4201 (GET, OPTIONS)