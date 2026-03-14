# Backend API (Admin/Auth)

Cloudflare Worker для админки и авторизации.

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
- `.dev.vars` — env-переменные (SUPABASE_URL, ключи, JWT_SECRET, CORS_ORIGIN)