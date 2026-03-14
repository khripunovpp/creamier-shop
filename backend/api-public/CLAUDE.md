# Backend API (Public)

Cloudflare Worker для публичного API магазина. Изолирован от admin Worker — не имеет доступа к service key, JWT и другим секретам.

## Стек

- **Runtime:** Cloudflare Workers
- **Framework:** Hono v4
- **Validation:** Zod v4 + @hono/zod-validator
- **DB:** Supabase (PostgreSQL) через publishable key

## Структура

```
src/
  index.ts                       — Точка входа, CORS, роутинг
  routes/public-routes.ts        — Products (GET), Orders/create (POST)
  schemes/create-order.scheme.ts — Zod-схема создания заказа
  utils/pg-error-mapper.ts       — Маппинг PG-ошибок в user-facing сообщения
```

## Команды

- `npx wrangler dev` — dev-сервер (порт 3334)
- `npx wrangler deploy` — деплой на Cloudflare

## Конфигурация

- `wrangler.toml` — конфиг Cloudflare Worker
- `.dev.vars` — env-переменные (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, CORS_ORIGIN)

## Безопасность

- Только publishable key — нет доступа к admin-операциям
- Zod-валидация на всех POST-эндпоинтах
- PG-ошибки маппятся, сырые сообщения не утекают клиенту
- IP клиента берётся из CF-Connecting-IP (за Cloudflare)
- Rate limiting на уровне БД (1 заказ/мин на IP)