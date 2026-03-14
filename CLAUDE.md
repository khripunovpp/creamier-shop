# Creamier Shop

Монорепозиторий интернет-магазина кондитерских изделий. Loose monorepo (без Nx/Turborepo), каждое приложение со своим package.json.

## Структура

```
backend/
  api/          — Admin/Auth Cloudflare Worker (Hono, порт 3333)
  api-public/   — Public Cloudflare Worker (Hono, порт 3334)
  supabase/     — PostgreSQL миграции и конфиг Supabase
  scripts/      — Утилитарные скрипты
frontend/
  shop/         — Клиентское Angular-приложение (SSR, порт 4201)
  admin/        — Админ-панель Angular (порт 4200)
```

## Стек

- **Backend:** Hono на Cloudflare Workers, Supabase (PostgreSQL 17), Zod валидация
- **Frontend:** Angular 21 (next), Angular Material, TypeScript 5.9
- **БД:** Supabase (локально: API порт 54321, DB порт 54322)
- **Package manager:** npm

## Запуск

- Backend Admin API: `cd backend/api && npx wrangler dev` (порт 3333)
- Backend Public API: `cd backend/api-public && npx wrangler dev` (порт 3334)
- Frontend Shop: `cd frontend/shop && npx ng serve` (порт 4201)
- Frontend Admin: `cd frontend/admin && npx ng serve` (порт 4200)
- Supabase: `cd backend/supabase && npx supabase start`

## API маршруты

### api (порт 3333)
- `/api/admin/*` — защищены `requireAdmin` + CSRF middleware (cookie `admin_token`)
- `/api/auth/*` — логин + CSRF token endpoint

### api-public (порт 3334)
- `/api/products` — список продуктов
- `/api/products/:id` — продукт по ID
- `/api/orders/create` — создание заказа (Zod валидация)

## Конвенции

- Коммиты: `[scope] описание` — scope: shop, admin, api, db
- Язык кода и комментариев: английский
- Валидация: Zod-схемы в `schemes/` директориях Worker'ов
- CORS origin через env-переменную `CORS_ORIGIN`

## Рабочий процесс

- При планировании по пунктам: сначала показать план → получить подтверждение → выполнять по одному шагу, спрашивая разрешение перед каждым следующим