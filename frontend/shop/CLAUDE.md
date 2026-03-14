# Frontend — Shop

Клиентское Angular-приложение с SSR.

## Стек

- **Framework:** Angular 21 (next) с SSR (Express 5)
- **UI:** Angular Material 21
- **Notifications:** @ngxpert/hot-toast

## Структура

```
src/
  main.ts / main.server.ts / server.ts  — Точки входа (browser, SSR, Express)
  app/                 — Корневой компонент
  home/                — Главная страница
  view/
    layout/            — Header, footer
    sections/          — Секции страниц
    products/          — Каталог продуктов
    cart/              — Корзина
    order/             — Оформление заказа
  service/
    services/          — HTTP-сервисы
    providers/         — DI-провайдеры
    helpers/           — Хелперы
  shared/ui/           — Переиспользуемые UI-компоненты
  types/               — TypeScript интерфейсы
  env/                 — Конфигурация окружения
  scss/                — Глобальные стили
```

## Команды

- `npx ng serve` — dev-сервер (порт 4201)
- `npx ng build` — сборка (с SSR)