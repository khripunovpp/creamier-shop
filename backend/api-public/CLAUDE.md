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
  index.ts                       — Точка входа, роутинг
  routes/public-routes.ts        — Products (GET), Orders/create (POST), CORS, body limit
  schemes/create-order.scheme.ts — Zod-схема с санитайзингом и .strict()
  utils/
    pg-error-mapper.ts           — Маппинг PG-ошибок в user-facing сообщения
    sanitize.ts                  — Strip HTML, zero-width chars, trim
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
- Санитайзинг входных данных (strip HTML, zero-width unicode, trim)
- Body size limit 64KB
- `.strict()` на Zod-схеме — лишние поля отклоняются
- DEV_MODE fallback для локальной разработки без Cloudflare