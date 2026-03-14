# Frontend — Admin

Админ-панель для управления магазином.

## Стек

- **Framework:** Angular 21 (next)
- **UI:** Angular Material 21, @ng-select/ng-select
- **Notifications:** @ngxpert/hot-toast
- **Backend:** Прямые вызовы Supabase + API через backend/api

## Структура

```
src/app/
  dashboard/           — Главная панель
  stock/               — Управление товарами
  categories/          — Управление категориями
  orders/
    overview/          — Список заказов
    builder/           — Создание/редактирование заказов
  login/               — Страница авторизации
  errors/              — Страницы ошибок
  shared/
    ui/                — Переиспользуемые компоненты (card, layout, controls, dialogs)
    directives/        — Директивы
    providers/         — DI-провайдеры
    services/          — Сервисы (Supabase интеграция)
    models/            — Интерфейсы данных
    const/             — Константы
    helpers/           — Утилиты
```

## Команды

- `npx ng serve` — dev-сервер (порт 4200)
- `npx ng build` — сборка