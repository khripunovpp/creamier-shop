# Supabase (PostgreSQL)

Конфигурация и миграции базы данных.

## Структура

```
config.toml            — Конфиг Supabase CLI
migrations/            — SQL-миграции
snippets/              — SQL-сниппеты (не в продакшене)
.data/data.sql         — Снапшот данных
```

## Команды

- `npx supabase start` — запуск локального Supabase
- `npx supabase stop` — остановка
- `npx supabase db reset` — сброс БД и применение миграций
- `npx supabase migration new <name>` — создание новой миграции

## Локальные порты

- API: 54321
- DB (PostgreSQL): 54322
- Studio: по умолчанию 54323