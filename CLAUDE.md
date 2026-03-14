# Creamier Shop

Монорепозиторий интернет-магазина кондитерских изделий. Loose monorepo (без Nx/Turborepo), каждое приложение со своим package.json.

## Структура

```
backend/
  api/          — Cloudflare Workers API (Hono, TypeScript, Supabase)
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

- Backend API: `cd backend/api && npx wrangler dev` (порт 3333)
- Frontend Shop: `cd frontend/shop && npx ng serve` (порт 4201)
- Frontend Admin: `cd frontend/admin && npx ng serve` (порт 4200)
- Supabase: `cd backend/supabase && npx supabase start`

## API маршруты

- `/api/public/*` — публичные (продукты, создание заказа)
- `/api/admin/*` — защищены `requireAdmin` middleware (cookie `admin_token`)
- `/api/auth/*` — логин
- `/api/telegram/*` — вебхук Telegram-бота

## Конвенции

- Коммиты: `[scope] описание` — scope: shop, admin, api, db
- Язык кода и комментариев: английский
- Валидация: Zod-схемы в `backend/api/src/schemes/`