# План переноса шаблона `source/sweet-thing-v2.html` → текущий стек

Шаблон — одностраничник Patissière (тарталетки + эклеры) на React-CDN. Цель: разложить
его на Angular-компоненты (`frontend/shop`), создать недостающие сервисы и доработать
бекенд (`backend/api-public`, `backend/supabase`), сохранив существующие конвенции.

---

## 0. Что уже есть и переиспользуем

Уже на месте (`frontend/shop/src/`):
- Компоненты-каркас: `view/sections/header.component.ts`, `view/sections/hero.component.ts`,
  `view/sections/products.component.ts`, `view/products/product-item.component.ts`,
  `view/cart/cart-widget.component.ts`, `view/order/{order, order-content, order-delivery}.component.ts`,
  `view/layout/*`, `shared/ui/tabs/*`.
- Сервисы: `api.service`, `products.service`, `cart.service`, `delivery.service`,
  `order.service`, `notifications.service`.
- Типы: `Product`, `Order`, `CartItem`, `Countable`.
- `csrf.interceptor`, `is_home_page` провайдер, `hot-toast`.
- Env: `worker_url` (`http://localhost:3334`).

Backend (`backend/api-public/src/`): уже есть `GET /api/products`, `GET /api/products/:id`,
`POST /api/orders/create` через RPC `create_order(...)`. Конвенции — Zod `.strict()`,
ответ `{ error: string }` при ошибке, прямые данные при успехе.

Supabase: таблицы `stock_items`, `categories`, `orders`, `order_items`, `customers`,
вью `public_products`, функция `create_order`. Поле `badge` уже есть.

---

## 1. Доменная модель: как ложатся «тарталетки/эклеры с вкусами» на текущую БД

Шаблон оперирует **наборами**: тарталетка (всегда 4 шт., 1 или 2 вкуса, €14) и эклер
(размер 2/3/4, при 4 — 1 или 2 вкуса, цены €8/€11/€14). На фронте мы хотим API
`/api/sets`, отдающую массив объектов вида:

```ts
type SetDto = {
  id: string;
  slug: string;                       // 'tartlet' | 'eclair'
  name_ru: string; name_pt: string;
  description_ru?: string; description_pt?: string;
  items: FlavorDto[];                 // вкусы внутри сета
  rules: {
    id: string;                       // нужен фронту, чтобы передать в заказ
    count: number;                    // кол-во элементов в наборе (2 / 3 / 4)
    price: number;                    // цена за коробку
    max_flavors: number;              // макс. число вкусов на коробку
  }[];
};
```

Один **set** ≈ «продукт-категория» («Тарталетки» / «Эклеры»). У него массив **rules**,
каждое правило — конкретная конфигурация (count + price + max_flavors). У тарталеток
1 правило, у эклеров — 3.

Чтобы это легло на БД, перестраиваем таблицы:

- **Таблица `categories` удаляется** (`DROP TABLE categories` + предварительно убираем
  `stock_items.category_id`). На фронте категорий нет, сеты сами по себе — верхний уровень.
- **Сеты** — новая таблица `stock_sets`:
  ```sql
  CREATE TABLE stock_sets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,                       -- 'tartlet', 'eclair'
    name_ru TEXT NOT NULL,
    name_pt TEXT NOT NULL,
    description_ru TEXT,
    description_pt TEXT,
    status stock_status NOT NULL DEFAULT 'active',
    position INT NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  ```
- **Правила сета** — `stock_set_rules` (одна строка = одна конфигурация):
  ```sql
  CREATE TABLE stock_set_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id uuid NOT NULL REFERENCES stock_sets(id) ON DELETE CASCADE,
    count INT NOT NULL CHECK (count > 0),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    max_flavors INT NOT NULL DEFAULT 1 CHECK (max_flavors > 0),
    position INT NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (set_id, count)
  );
  ```
  Тарталетки → 1 строка `(tartlet, count=4, price=14, max_flavors=2)`.
  Эклеры → 3 строки: `(eclair, 2, 8, 1)`, `(eclair, 3, 11, 1)`, `(eclair, 4, 14, 2)`.
- **Какие `stock_items` доступны для каждого сета — M:M через `stock_set_items`**:
  ```sql
  CREATE TABLE stock_set_items (
    set_id uuid NOT NULL REFERENCES stock_sets(id) ON DELETE CASCADE,
    stock_item_id uuid NOT NULL REFERENCES stock_items(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    PRIMARY KEY (set_id, stock_item_id)
  );
  CREATE INDEX stock_set_items_set_idx ON stock_set_items (set_id, position);
  ```
  Это и есть «в админке указать какие stock_item доступны в этом сете». Один и тот же
  вкус (например, «Клубника») может быть привязан к нескольким сетам без дублирования.
- **`stock_items`** теряет `category_id` и теперь живёт независимо от сетов
  (ссылки идут только через `stock_set_items`). Добавляем колонки:
  - `name_pt TEXT` (название PT)
  - `detail_ru TEXT`, `detail_pt TEXT` (короткое описание)
  - `tags_ru TEXT[]`, `tags_pt TEXT[]`
  - `photo_id uuid REFERENCES photos(id) ON DELETE SET NULL`
  - `position INT NOT NULL DEFAULT 0` (глобальный порядок внутри сета задаёт
    `stock_set_items.position`)
- **Фото продуктов** — отдельная таблица **`photos`** (только для вкусов;
  hero и галерея — статика на фронте, не БД):
  ```sql
  CREATE TABLE photos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    alt_ru TEXT,
    alt_pt TEXT,
    created_at timestamptz NOT NULL DEFAULT now()
  );
  ```
- **Состав заказа** — модель через две связи в `order_items`:
  - `ALTER TABLE order_items ADD COLUMN stock_set_rule_id uuid REFERENCES stock_set_rules(id)`.
  - `ALTER TABLE order_items ALTER COLUMN stock_item_id DROP NOT NULL`.
  - `CHECK ((stock_item_id IS NOT NULL) <> (stock_set_rule_id IS NOT NULL))` —
    строка ссылается **либо** на штучный товар (для возможных будущих штучных продаж),
    **либо** на конкретное правило сета. Поле `price` остаётся (на момент заказа
    фиксируем `rules.price`).
  - Новая таблица `order_item_flavors` — список выбранных вкусов в каждой заказанной коробке:
    ```sql
    CREATE TABLE order_item_flavors (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_item_id uuid NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
      stock_item_id uuid NOT NULL REFERENCES stock_items(id) ON DELETE RESTRICT,
      position INT NOT NULL DEFAULT 0
    );
    CREATE INDEX order_item_flavors_order_item_idx ON order_item_flavors (order_item_id);
    ```
    Это нормально считаемая аналитика «сколько раз заказали клубнику» без JSON-парсинга.

---

## 2. Миграции Supabase (`backend/supabase/migrations/`)

Новая миграция `20260514_template_migration.sql`:

1. **Чистим старое**:
   - `ALTER TABLE stock_items DROP COLUMN category_id` (вместе с FK).
   - `DROP TABLE categories`.
   - Удалить `public_products` view (пересоздадим ниже как `public_sets` либо переименуем).
2. **`stock_sets`**: `CREATE TABLE stock_sets (id, slug UNIQUE, name_ru, name_pt,
   description_ru, description_pt, status stock_status DEFAULT 'active', position,
   created_at)` + RLS «admin full access» + GRANT SELECT для anon/authenticated.
3. **`stock_set_rules`**: `CREATE TABLE stock_set_rules (id, set_id FK ON DELETE CASCADE,
   count, price, max_flavors, position, created_at, UNIQUE(set_id, count))` + RLS + grants.
4. **`photos`**: `CREATE TABLE photos (id, url, alt_ru, alt_pt, created_at)` + RLS
   «admin full access» (анону не нужен прямой SELECT — он читает фото через вью).
5. **Расширение `stock_items`**: добавить `name_pt`, `detail_ru`, `detail_pt`,
   `tags_ru TEXT[]`, `tags_pt TEXT[]`, `photo_id` (FK на `photos`), `position`.
6. **`stock_set_items`** (M:M): `CREATE TABLE stock_set_items (set_id FK ON DELETE CASCADE,
   stock_item_id FK ON DELETE CASCADE, position, PRIMARY KEY(set_id, stock_item_id))`
   + индекс `(set_id, position)` + RLS.
7. **`order_items`**:
   - `ALTER COLUMN stock_item_id DROP NOT NULL`,
   - `ADD COLUMN stock_set_rule_id uuid REFERENCES stock_set_rules(id)`,
   - `ADD CONSTRAINT order_items_target_chk CHECK ((stock_item_id IS NOT NULL)
     <> (stock_set_rule_id IS NOT NULL))`.
8. **`order_item_flavors`**: `CREATE TABLE order_item_flavors (id, order_item_id FK
   ON DELETE CASCADE, stock_item_id FK, position)` + индекс `(order_item_id)` + RLS.
9. **Вью `public_sets`** (готовый ответ для `/api/sets`):
   ```sql
   CREATE VIEW public_sets AS
   SELECT
     s.id, s.slug, s.name_ru, s.name_pt,
     s.description_ru, s.description_pt, s.position,
     COALESCE((
       SELECT json_agg(
         json_build_object(
           'id', i.id,
           'name_ru', i.name, 'name_pt', i.name_pt,
           'detail_ru', i.detail_ru, 'detail_pt', i.detail_pt,
           'tags_ru', i.tags_ru, 'tags_pt', i.tags_pt,
           'photo', CASE WHEN p.id IS NOT NULL THEN
                       json_build_object('url', p.url, 'alt_ru', p.alt_ru, 'alt_pt', p.alt_pt)
                    ELSE NULL END
         ) ORDER BY ssi.position
       )
       FROM stock_set_items ssi
       JOIN stock_items i ON i.id = ssi.stock_item_id AND i.status = 'active'
       LEFT JOIN photos p ON p.id = i.photo_id
       WHERE ssi.set_id = s.id
     ), '[]'::json) AS items,
     COALESCE((
       SELECT json_agg(
         json_build_object(
           'id', r.id, 'count', r.count, 'price', r.price, 'max_flavors', r.max_flavors
         ) ORDER BY r.position, r.count
       )
       FROM stock_set_rules r
       WHERE r.set_id = s.id
     ), '[]'::json) AS rules
   FROM stock_sets s
   WHERE s.status = 'active'
   ORDER BY s.position;
   ```
10. **Переписать `create_order(...)`**:
   - Принимает `p_items jsonb`, где каждый элемент:
     ```
     { "stock_set_rule_id": uuid, "flavor_ids": [uuid, ...], "quantity": int }
     ```
     — **без** `price` от клиента.
   - Для каждого item:
     - `SELECT r.*, s.id AS set_id FROM stock_set_rules r
        JOIN stock_sets s ON s.id = r.set_id
        WHERE r.id = stock_set_rule_id AND s.status = 'active' FOR SHARE`
       (если нет — `RAISE EXCEPTION 'Invalid set rule'`).
     - Проверка `array_length(flavor_ids) BETWEEN 1 AND r.max_flavors`.
     - Проверка, что все `flavor_ids` доступны в этом сете:
       `SELECT count(*) FROM stock_set_items WHERE set_id = r.set_id AND stock_item_id = ANY(flavor_ids)`
       должно равняться `array_length(flavor_ids, 1)`.
     - `INSERT INTO order_items (order_id, stock_set_rule_id, price, quantity)
       VALUES (order_id, r.id, r.price, quantity) RETURNING id`.
     - Для каждого `flavor_id` (с `position`) — `INSERT INTO order_item_flavors`.
   - `total_amount` = `SUM(r.price * quantity)`.
   - Сохраняется тот же контракт «вернуть `order_id`», тот же rate-limit, та же логика `customers`.
11. **Сидинг** (отдельной миграцией `20260514_template_seed.sql`):
   - Загрузить в `photos` фото вкусов (`url = '/photos/<file>'`).
   - Создать `stock_sets`: `(tartlet, …)`, `(eclair, …)`.
   - `stock_set_rules`: для tartlet `(count=4, price=14, max_flavors=2)`;
     для eclair `(2,8,1)`, `(3,11,1)`, `(4,14,2)`.
   - `stock_items` для всех вкусов из шаблона (TARTLET_FLAVORS, ECLAIR_FLAVORS),
     с `photo_id`.
   - `stock_set_items` — привязать вкусы к сетам (тарталетные вкусы → tartlet,
     эклерные → eclair; общие, если есть, привязываем к обоим).

---

## 3. Бекенд `backend/api-public`

1. **Новый роут** `GET /api/sets` — единственный эндпойнт каталога:
   - SELECT из вью `public_sets`.
   - Ответ — массив `SetDto` (см. структуру в §1).
2. **Удалить** `GET /api/products` и `GET /api/products/:id` — больше не нужны фронту;
   убираем из роутера (или оставляем в комментах до подтверждения).
3. Обновить `schemes/create-order.scheme.ts`:
   - В `items` каждый элемент:
     ```
     {
       stock_set_rule_id: z.uuid(),
       flavor_ids: z.array(z.uuid()).min(1).max(4),
       quantity: z.number().int().positive().max(100)
     }
     ```
   - Поля контакта: оставить `email/phone_number/telegram/whatsapp` (как сейчас),
     но добавить `contact_channel: enum('whatsapp','telegram','phone','email')`
     — шаблон требует выбрать один способ связи.
   - Добавить опциональный `delivery_time TEXT` (слот времени из шаблона,
     например `"14:00–15:00"`) — кладём в `delivery_info`.
4. Обновить вызов RPC `create_order` под новую сигнатуру (см. §2 п. 10).

---

## 4. Frontend shop — структурное разделение шаблона

Целевая структура (`frontend/shop/src/`):

```
view/
  sections/
    header.component.ts            (есть, переделать: логотип Patissière, nav, lang switch, cart pill)
    hero.component.ts              (есть, переделать на верстку шаблона)
    editorial.component.ts         (НОВ — «О сезонности», цитата шефа)
    gallery.component.ts           (НОВ — две строки авто-прокрутки)
    reviews.component.ts           (НОВ — 3 карточки отзывов, средняя тёмная)
    catering.component.ts          (НОВ — блок «Кейтеринг»)
    footer.component.ts            (НОВ — выносим из app.html)
  products/
    product-section.component.ts   (НОВ — обёртка продукт-секции: заголовок + карусель + панель заказа)
    flavor-card.component.ts       (НОВ — карточка вкуса с фото, тегами, чекмарком)
    flavor-carousel.component.ts   (НОВ — карусель с perView по брейкпойнтам, swipe/click)
    order-panel.component.ts       (НОВ — выбор size/mode/qty + цена + «в корзину»)
  cart/
    cart-widget.component.ts       (есть, переделать: drawer, группировка по kind, удаление/qty)
    cart-fab.component.ts          (НОВ — плавающая кнопка корзины)
  order/
    order.component.ts             (есть, переделать: имя, выбор канала контакта, дата+календарь, time slot, pickup/delivery)
    order-content.component.ts     (есть, переделать на новые данные)
    order-delivery.component.ts    (есть, расширить — самовывоз/доставка + адрес для доставки)
  layout/                          (без изменений)
shared/
  ui/
    toast/                         (НОВ — обёртка над hot-toast или своя; уже подключен @ngxpert/hot-toast)
    tabs/                          (есть)
    icon.component.ts              (НОВ опционально — для SVG-стрелок и галочки)
home/
  home.component.ts                (есть — расширить: HeroComponent → ProductSection × 2 → Editorial → Gallery → Reviews → Catering)
```

### Сервисы

- `service/services/sets.service.ts` (НОВ) — `GET /api/sets`. Возвращает
  `Set[]` (см. структуру в §1). Кеширует в `BehaviorSubject`, используется
  `ProductSectionComponent`, `OrderPanelComponent`, `FlavorCarouselComponent`,
  `CartWidgetComponent` для отображения цены и состава.
- `products.service.ts` (есть) — **удаляем** (или оставляем как deprecated-шим
  до завершения миграции, потом снести).
- `cart.service.ts` (есть) — переделать модель элемента корзины:
  ```ts
  type SetCartItem = {
    stock_set_rule_id: string;   // конкретное правило (count+price+max_flavors)
    flavor_ids: string[];        // 1..max_flavors
    quantity: number;
    // денормализованные поля для отображения (не отправляются на бек):
    set_slug: string;            // 'tartlet' | 'eclair'
    set_name_ru: string; set_name_pt: string;
    count: number;
    price: number;               // из rules.price
  };
  ```
  Сохранение в localStorage; стримы `cart$`, `count$`, `sum$`.
  На сервер отправляется только `{ stock_set_rule_id, flavor_ids, quantity }`.
- `i18n.service.ts` (НОВ) — простая локализация RU/PT. Сигналы Angular:
  `lang = signal<'ru'|'pt'>('ru')`, `t(ru, pt)` хелпер. Сохраняем выбор в localStorage.
  Без `@ngx-translate` (оверкилл для двух языков).
- `order.service.ts` (есть) — поправить тело запроса под новую схему (см. §3).
- `notifications.service.ts` (есть) — переиспользуем для toast при ошибках выбора вкуса.

### Типы (`src/types/`)

- `set.type.ts` (НОВ) — `Set { id, slug, name_ru, name_pt, description_ru?, description_pt?,
  items: Flavor[], rules: Rule[] }`.
- `flavor.type.ts` (НОВ) — `Flavor { id, name_ru, name_pt, detail_ru?, detail_pt?,
  tags_ru?: string[], tags_pt?: string[], photo?: { url, alt_ru?, alt_pt? } }`.
- `rule.type.ts` (НОВ) — `Rule { id, count, price, max_flavors }`.
- `cart.type.ts` — заменить на `SetCartItem` (см. выше).
- `order.type.ts` — добавить `contact_channel`, `delivery_time`.
- `product.type.ts` — **удаляем** (заменяется на `flavor.type.ts`).

### Статика — фотографии

- Перенести `source/фото/*.JPG|PNG` в `frontend/shop/public/photos/` с ASCII-именами
  (кириллица в URL не дружит с Workers/Cloudflare). Имена в исходниках уже почти все ASCII.
- **Фото вкусов**: в сидинге БД создаём строки в `photos` с `url = '/photos/<file>'`,
  затем `stock_items.photo_id` — ссылки на эти строки.
- **Фото для hero и галереи**: остаются **статикой** в `frontend/shop/public/photos/`,
  список и порядок хардкодятся в `HeroComponent` / `GalleryComponent` (как в шаблоне).
  В БД эти фото не лежат.

### Стили

- Глобальные токены из шаблона (`--bg`, `--cream`, `--forest`, `--pink`, `--mint`,
  `--f-disp`, `--f-sans`, `--f-price`) — добавить в `src/styles.scss` поверх существующих.
- Подключить Google Fonts (Italiana, Quicksand, Work Sans) через `index.html` (`<link>`).
- CSS из шаблона — раскидать **по компонентам** (inline `styles:` в каждом standalone-компоненте),
  без отдельного «глобального» CSS-дампа. Это уже принятая в проекте конвенция (inline styles в компонентах).

---

## 5. Локализация RU/PT

- Сигнал `lang` в `I18nService`, переключатель в `HeaderComponent`.
- В шаблонах: `{{ i18n.t('Тарталетки','Tarteletes') }}` — короткий хелпер.
- В моделях БД — двойные поля `name`/`name_pt`, `detail_ru`/`detail_pt`,
  `tags_ru`/`tags_pt`, `description_ru`/`description_pt`.
- В ответе `GET /api/sets` отдаём оба варианта (`name_ru`/`name_pt` и т.д.);
  фильтрация по `lang` — на фронте.

---

## 6. Корзина и checkout — особенности

- Группировка в drawer по `set_slug` (как в шаблоне: «Тарталетки» отдельно, «Эклеры» отдельно).
- Отображение состава строки: список вкусов через «×» (`Клубника × Фисташка`),
  `count`, `quantity`, цена.
- Сумма — сумма `price * quantity` по всем строкам корзины.
- Чекаут:
  - Имя (обязательно).
  - Канал связи: радио-выбор (WhatsApp / Telegram / Телефон / Email) → одно поле ввода под выбранный канал.
  - Дата получения: календарь (нативный `<input type="date">` — проще всего, либо `MatDatepicker` — он уже в `package.json`).
  - Слот времени: dropdown (`10:00–11:00`, …) — массив на фронте.
  - Способ получения: `pickup` / `delivery` (если `delivery` — текстовое поле адреса в `delivery_info.address`).
  - Комментарий (опц.).
- Submit: `OrderService.create()` → `POST /api/orders/create`. На успехе — экран
  подтверждения (отдельная страница `/order/success` или модалка). На ошибке —
  toast с человеческим текстом из `{ error }`.

---

## 7. Этапы выполнения (по одному, с подтверждением каждого)

1. **БД**: миграция со схемой — удаление `categories` и `public_products`,
   создание `stock_sets`, `stock_set_rules`, `stock_set_items` (M:M), `photos`;
   расширение `stock_items` (локализация, photo_id); правки `order_items`
   (nullable `stock_item_id`, новый `stock_set_rule_id`, CHECK), новая
   `order_item_flavors`; вью `public_sets`; обновлённый `create_order`.
2. **БД-сидинг**: фото + сеты + правила + вкусы + M:M-привязка `stock_set_items`
   из шаблона.
3. **Статика**: перенести фотографии в `frontend/shop/public/photos/`,
   прописать пути в сидинге.
4. **Backend `api-public`**:
   - Добавить `GET /api/sets`.
   - Удалить `GET /api/products` / `GET /api/products/:id`.
   - Обновить `create-order.scheme.ts` (новые `items` + `contact_channel` + `delivery_time`).
   - Обновить вызов RPC под новую сигнатуру.
5. **Frontend shop — фундамент**:
   - Подключить Google Fonts, обновить `styles.scss` (CSS-токены шаблона).
   - `I18nService` + переключатель языка.
   - Обновить типы (`set`, `flavor`, `rule`, `cart`, `order`).
   - `SetsService`.
   - Переписать `CartService` под `SetCartItem` (см. §4).
6. **Frontend shop — секции**:
   - `HeaderComponent` (переделать).
   - `HeroComponent` (переделать под шаблон).
   - `ProductSectionComponent` + `FlavorCarouselComponent` + `FlavorCardComponent` + `OrderPanelComponent` (две инстанции на главной: тарталетки и эклеры).
   - `EditorialComponent`, `GalleryComponent`, `ReviewsComponent`, `CateringComponent`, `FooterComponent`.
   - Собрать всё в `HomeComponent`.
7. **Frontend shop — корзина и заказ**:
   - `CartFabComponent` + переработка `CartWidgetComponent` (drawer, группировка).
   - Переработка `OrderComponent` (форма с каналом связи, датой, слотом, способом получения).
   - Экран подтверждения заказа.
8. **Проверка**:
   - `npm run start` в `frontend/shop` + `npx wrangler dev` в `backend/api-public` +
     `npx supabase start`.
   - Прогон сценария: выбор вкусов → корзина → checkout → запись в БД.
   - Адаптив (desktop / tablet / mobile).
   - Переключение RU/PT.

---

## 7a. Разделение схем БД (`private` / `public`)

**Принятое решение**: разносим схемы.

- **`private`** — все admin-managed таблицы (новые и существующие). Анону доступа в схему нет.
- **`public`** — только то, что должно быть доступно публично: вью `public_sets`,
  RPC `create_order`. Через них и только через них публичный shop читает/пишет.

Что переезжает в `private` в этой миграции:
- Существующие: `stock_items`, `orders`, `order_items`, `order_history`,
  `stock_changes`, `stock_movements`, `customers`, `order_rate_limits`.
- Новые: `stock_sets`, `stock_set_rules`, `photos`, `stock_set_items`,
  `order_item_flavors`.
- `categories` — дропается (см. §2.1).

Что остаётся в `public`:
- Вью `public.public_sets` (читает из `private.*`, `GRANT SELECT TO anon, authenticated`).
- Функция `public.create_order(...)` — `SECURITY DEFINER` с `SET search_path = ''`,
  все имена таблиц квалифицированы как `private.*`. `GRANT EXECUTE TO anon, authenticated`.

Гранты схемы:
- `GRANT USAGE ON SCHEMA private TO authenticated, service_role` (анону — **нет**).
- `GRANT ALL ON ALL TABLES IN SCHEMA private TO service_role`
  (+ `ALTER DEFAULT PRIVILEGES`).
- Существующие RLS-политики «admin full access» переезжают вместе с таблицами
  (`ALTER TABLE ... SET SCHEMA` это сохраняет).

Что нужно поправить **вне миграции**: `backend/api/src/*` — в местах, где `supabase-js`
делает `.from('table_name')`, добавить `.schema('private').from('table_name')`.
Это последний под-шаг этапа 1 (1.9 ниже).

**Открытая задача (отложена)**: `backend/api/src/utils/supabse-client.ts` сейчас
создаёт клиент с `SUPABASE_SERVICE_KEY` и кладёт его в контекст в `auth.ts` middleware,
после чего **все** admin routes ходят через `service_role` (RLS-политики `TO authenticated`
бипасятся). Правильный паттерн: SERVICE_KEY оставить только для `auth.getUser(token)`,
а в контекст класть второй клиент, созданный из юзерского JWT (через
`createClient(URL, ANON_KEY, { global: { headers: { Authorization: 'Bearer ' + token }}})`).
Тогда RLS реально начнёт работать. В текущую итерацию **не делаем**, гранты в миграции
заложим под оба сценария.

---

## 8. Безопасность

Принцип: ничего лишнего сверх уже принятых в проекте конвенций. То, что **обязательно**:

1. **RLS на всех новых таблицах**. Политика `admin full access` (USING `true`,
   WITH CHECK `true`, TO `authenticated`) — по образцу существующих. **Никаких** прямых
   политик для `anon` — публичный shop ходит только через `public_sets` (вью под
   `security_invoker = off` / `security_definer` нет; используем `GRANT SELECT ON
   public_sets TO anon, authenticated`).
2. **`photos`, `stock_set_items`** — `anon` доступа к самой таблице **не даём**,
   только через вью.
3. **Никакой клиентской цены** — `create_order` берёт цену из `stock_set_rules.price`,
   `p_price` в RPC отсутствует как параметр.
4. **Валидация принадлежности вкусов**: внутри `create_order`
   `count(*) FROM stock_set_items WHERE set_id = r.set_id AND stock_item_id = ANY(flavor_ids)`
   должен быть равен `array_length(flavor_ids, 1)`. Иначе `RAISE EXCEPTION 'Invalid flavor'`.
5. **Анти-спам**: оставляем существующий `order_rate_limits` (1 заказ/мин на client_key) —
   не трогаем.
6. **CSRF**: включаем middleware на `POST /api/orders/create` (сейчас закомментирован) —
   двойной cookie + `X-CSRF-Token` header. Шаблон уже есть.
7. **Zod `.strict()`** на схеме заказа (запрет неизвестных полей). UUID через `z.uuid()`,
   массивы — с `.min(1).max(N)`, числа — с явными границами.
8. **Sanitize** для текстовых полей имени/комментария/контактов — переиспользуем
   существующий `sanitize.ts` (`stripHtml` + zero-width remove).
9. **CORS**: origin строго из `env.CORS_ORIGIN` (как сейчас), methods только
   `GET, POST, OPTIONS`. `/api/sets` — публичный GET.
10. **bodyLimit 64KB** — оставить.
11. **Ошибки** — наружу только `{ error: string }` через `pg-error-mapper`. Никаких
    стектрейсов / PG-кодов клиенту.
12. **Стат-файлы (`/photos/*`)** обслуживает Angular SSR / static-host — это статика,
    ничего не загружается пользователями. Если позже появится upload — отдельный
    защищённый эндпойнт в `api` (admin), не в `api-public`.

Что осознанно **не делаем** в эту итерацию: WAF/Cloudflare правила, recaptcha,
audit-log для shop, отдельные роли БД для read-only. Это можно добавить, когда появится
реальный трафик.

---

## 9. Оптимизации

Только дешёвые и заметные. Без оверинжиниринга.

1. **Один запрос на каталог**: вся витрина грузится через `GET /api/sets`.
   Нет N+1 на фронте, нет отдельного запроса за фото / правилами.
2. **Кеш на фронте**: `SetsService` хранит ответ в `BehaviorSubject`, повторных
   запросов в рамках сессии нет. Переключение языка не дёргает API (одна и та же
   нагрузка, переключение поля на клиенте).
3. **Cache-Control для `/api/sets`**: `Cache-Control: public, max-age=60,
   stale-while-revalidate=600`. Этого достаточно — каталог редко меняется,
   а Cloudflare сам кеширует ответы Worker'а на edge.
4. **Индексы** (уже в миграции):
   - `stock_set_items (set_id, position)` — для вью.
   - `stock_set_rules (set_id, position)` — для вью.
   - `order_item_flavors (order_item_id)` — для JOIN в админке/отчётах.
   - `stock_items (status)` — на случай больших каталогов; в первой итерации
     данных мало, но индекс копеечный.
5. **SSR**: Angular shop уже на SSR. `GET /api/sets` вызывается на сервере при
   первом запросе, фронт получает гидрированную страницу без второго round-trip.
   Используем `TransferState` для переноса ответа клиенту (стандартный приём Angular,
   не пишем велосипед).
6. **Картинки**:
   - Один прогон оптимизации перед коммитом: ужать оригинальные JPG/PNG в
     `frontend/shop/public/photos/` до `max-width 1200px`, качество ~80
     (любой утилитой; не часть рантайма). Делаем один раз в этапе 3.
   - `loading="lazy"` на всех `<img>` ниже первого экрана (галерея, карточки
     вкусов в карусели после первого слайда).
   - `decoding="async"` на всех картинках.
   - Hero / above-the-fold картинки — без lazy.
7. **Bundle**:
   - Route `/order` — `loadComponent` (lazy), уже так настроено в `app.routes.ts`,
     сохраняем.
   - Не тянем `MatDatepicker` если идём через `<input type="date">` — отказ от
     Material datepicker экономит ~150KB.
8. **localStorage для корзины** уже есть в `cart.service` — оставляем; не пишем
   чаще одного раза за изменение (`distinctUntilChanged` на стриме).
9. **Без debounce-ов на UI-кнопках** (счётчик qty, выбор вкуса) — операции локальные,
   не дёргают сервер.

Что осознанно **не делаем**: материализованные вью, KV-кеш на Worker'е,
ServiceWorker / PWA, CDN-loader для картинок, prerender списка вкусов в HTML.

---

## 9a. Этап 9 — Админка под новую модель

Контекст: shop работает на новой модели (этапы 1–8), админка нет. Нужны admin-CRUD'ы под `stock_sets`, `stock_set_rules`, `stock_set_items` (M:M), `photos`, расширенные `stock_items` (локализация, теги, фото). Категории удаляются полностью. Заказы — расширить ответ join'ом `order_item_flavors`.

### Backend admin (`backend/api/`)

- **9.1** — обновить Zod-схемы: переписать `stock.scheme.ts` (выкинуть `category_id` и `is_service`, добавить `name_pt`, `detail_ru/pt`, `tags_ru/pt`, `photo_id`, `position`). Новые схемы: `stock-set.scheme.ts`, `stock-set-rule.scheme.ts`, `stock-set-item.scheme.ts`, `photo.scheme.ts`. Удалить `category.scheme.ts`.
- **9.2** — переписать `routes/admin/stock.ts`:
  - GET / GET/:id — отдавать новые поля (name_pt, detail_*, tags_*, photo_id, position). Убрать `category` join.
  - POST / PUT — принимать новые поля, валидировать новой схемой. Убрать `is_service`/`category_id`.
  - Остальные actions (archive/activate/deactivate/move) — без изменений.
- **9.3** — новые роуты:
  - `routes/admin/stock-sets.ts` — GET list, GET :id (с nested rules + items via stock_set_items), POST, PUT, archive/activate/deactivate (через `status`).
  - `routes/admin/stock-set-rules.ts` — GET list (по set_id), POST, PUT, DELETE. count лучше иммутабельным (UNIQUE по set_id+count).
  - `routes/admin/stock-set-items.ts` — POST `{set_id, stock_item_id, position}` для добавления, DELETE `{set_id, stock_item_id}` для удаления, PUT для смены позиции.
  - `routes/admin/photos.ts` — GET, GET :id, POST `{url, alt_ru, alt_pt}`, PUT, DELETE. URL вводится текстом (физический файл админ кладёт в `frontend/shop/public/photos/` отдельно; upload — будущая итерация).
- **9.4** — обновить `routes/admin/orders.ts` GET :id: `.select` должен включать `order_item_flavors (stock_item_id, position, stock_item:stock_items(name, name_pt))`, а в `order_items` добавить `stock_set_rule_id` и nested `rule:stock_set_rules(count, max_flavors, set:stock_sets(slug, name_ru, name_pt))`. Так админка увидит «Тарталетки 4 шт: Клубника + Фисташка».
- **9.5** — `index.ts` — подключить новые роуты:
  - `/api/admin/stock-sets`, `/api/admin/stock-set-rules`, `/api/admin/stock-set-items`, `/api/admin/photos`.

### Frontend admin (`frontend/admin/`)

- **9.6** — снести `categories/`: `categories.service.ts`, `categories/list/`, `categories/builder/`. Убрать из `app.routes.ts` пути `/categories*`. Убрать карточку «Категории» из dashboard.
- **9.7** — обновить `StockService`:
  - `StockItem` — добавить `name_pt`, `detail_ru/pt`, `tags_ru/pt`, `photo_id` (+ опц. `photo: { url, alt_ru, alt_pt } | null` при join'е), `position`. Убрать `category_id`, `category`, `is_service`.
  - `createProduct/updateProduct` — без `category_id`/`is_service`.
- **9.8** — новые сервисы: `StockSetsService`, `StockSetRulesService`, `StockSetItemsService`, `PhotosService`. Все по образцу существующих (`firstValueFrom + HttpClient`).
- **9.9** — `StockBuilderComponent`:
  - Поле «type Product/Service» убрать.
  - «Категория» (multiselect) убрать.
  - Добавить: `name_pt`, `detail_ru`, `detail_pt` (textarea), `tags_ru`/`tags_pt` (tags-control), `photo_id` (выбор из существующих через multiselect/dialog), `position` (number).
  - `badge` — оставить.
- **9.10** — `StockItemsComponent`:
  - Убрать группировку по `category_id`, плоский список.
  - Колонки: name (+name_pt), price, status, badge, actions.
- **9.11** — новые компоненты:
  - `StockSetListComponent` — таблица сетов (name_ru, slug, status, кол-во rules, actions). «Создать сет».
  - `StockSetBuilderComponent` — форма сета (slug, name_ru/pt, description_ru/pt, status, position) + подсекция «Правила» (inline list: count|price|max_flavors|position, add/delete) + подсекция «Доступные вкусы» (M:M-менеджер: список из `stock_items` с чекбоксами + reorder).
  - `PhotoListComponent` + `PhotoBuilderComponent` (или один компонент с inline-edit) — таблица фото (preview из url, alt_ru/pt, actions).
- **9.12** — `OrderBuilderComponent` / `OrdersService.Order`:
  - `items[]` → `{ stock_set_rule_id, flavor_ids[], quantity, price }` + nested `rule` + `flavors[]` (имена для отображения).
  - Read-only отображение — заказ создан с публичного фронта, админка только смотрит/меняет status. Если нужен POST/PUT — отдельный заход (сейчас orders.ts на бэке не имеет POST/PUT, так что компонент только редактирует status через mark_paid/mark_delivered).
- **9.13** — `app.routes.ts`: убрать `/categories*`, добавить `/stock-sets`, `/stock-sets/create`, `/stock-sets/:uuid`, `/photos`, `/photos/create`, `/photos/:uuid`.
- **9.14** — dashboard.component.ts: вместо карточки «Категории» — карточка «Наборы». Опц. карточка «Фото».

### Открытые вопросы по этапу 9

1. **Upload фото**: **через Cloudflare R2** (решено).
   - В `backend/api/wrangler.toml` добавить R2 binding (например, `[[r2_buckets]] binding = "PHOTOS" bucket_name = "creamier-photos"`).
   - Новый эндпойнт `POST /api/admin/photos/upload` — принимает multipart-файл, кладёт в R2 под уникальным ключом, возвращает публичный URL.
   - На фронте PhotoBuilder — file input, загружает через `FormData`, на ответе получает URL и создаёт запись в `photos` (или сразу в одном вызове).
   - Бакет публичный (или раздаётся через subdomain). `photos.url` хранит финальный URL.
   - До настройки CF аккаунта + бакета user'ом — код есть, но эндпойнт упадёт на отсутствии binding'а. Ручной paste URL тоже остаётся как fallback.
2. **Active set rules immutable count**: фиксировать `count` после создания правила, чтобы не ломать прошлые заказы? Закладываю: count — только при create, потом read-only (или возможность только удалить-создать заново).
3. **Удаление вкуса, который участвует в `order_item_flavors`**: FK на `stock_items` стоит `ON DELETE RESTRICT` — это правильно (нельзя удалить вкус, если он есть в истории заказов). Админка должна показывать понятную ошибку.
4. **Order detail в admin**: full read-only или возможность отредактировать состав? Закладываю read-only (заказы менять не можем, только статусы).

---

## 9b. Перед прод-деплоем (checklist)

Собранный в одном месте чек-лист «сделать перед запуском в прод». Сейчас отложено, поднимаем когда shop/admin переедут с localhost на Cloudflare Pages + Workers.

1. **Бэкапы БД** — **на Free-тарифе Supabase точек восстановления нет** (PITR + автоматические бекапы только на Pro). Полностью полагаемся на свой слой:
   - **Свой слой через Cloudflare cron**: отдельный Worker (например, `backend/api-backup/`) на расписании в `wrangler.toml`:
     ```toml
     [triggers]
     crons = ["0 3 * * *"]  # 03:00 UTC ежедневно
     ```
     Внутри Worker'а — `supabase-js` SELECT по таблицам схемы `private` (orders, order_items, order_item_flavors, customers, stock_items, stock_sets, stock_set_rules, stock_set_items, photos), сериализация в JSON (или CSV/SQL-INSERT).
   - **Куда складывать бекап** — варианты, выбрать один (или комбинировать):
     - **Cloudflare R2** — bucket с lifecycle-rule «keep 30 days». Дёшево, в той же экосистеме, дамп лежит как `backups/YYYY-MM-DD.json.gz`. Хороший дефолт.
     - **Email** через Resend / Mailchannels — отправлять JSON.gz attachment'ом на админскую почту. Подходит если объём мал (≤ нескольких MB) и хочется максимально простой «забрать руками». На крупных заказах объём бекапа быстро растёт — email-attachment станет узким местом.
     - **Hybrid**: R2 как primary, email-уведомление «бекап #N лежит в R2, размер X MB, link здесь» (без attachment). Сочетает удобство email-нотификаций и нормальный storage.
     - **S3 / Backblaze B2** — если нужен off-Cloudflare reliability. Доп. кред в env, доп. зависимость.
   - **Прогнать тестовое восстановление** хотя бы раз: scriptом загнать JSON-дамп обратно в свежий Supabase-проект, убедиться что схема и FK не ломаются. Без этого тесте backup'ы — иллюзия защиты.
   - Записать в `README.md` процедуру восстановления: «откатить за 1 час», «вытащить одну таблицу из дампа», у кого есть доступ к R2.
   - **Решение по umbrella-вопросу «куда» — отложено** до момента, когда зайдёт речь о деплое.

2. **CSRF** — включить `csrfProtection` в `backend/api-public` и `backend/api`. См. `memory/feedback_csrf_disabled.md` — требует HTTPS на обоих доменах и правильно настроенных `SameSite=None; Secure` cookies.

3. **CORS origins** — заменить локальные/wildcard origins на прод-домены в env-конфигах. Никаких `localhost` в публичных Workers.

4. **Секреты** — отдельные `SUPABASE_SERVICE_KEY`, `JWT_SECRET`, `CSRF_SECRET` для прод-инстанса Supabase, в Cloudflare Workers secrets. Не реиспользовать dev-ключи.

5. **Rate-limit** — нагрузочный прогон (artillery/k6) на `POST /api/orders/create`: убедиться что `private.order_rate_limits` справляется и БД не падает при синтетическом DDoS.

6. **Логи и алёрты**:
   - В `backend/api/wrangler.toml` и `backend/api-public/wrangler.toml` поменять
     `[observability] enabled = false` → `enabled = true` (плюс в `[observability.logs]`
     убрать невалидные поля типа `persist` если wrangler ругнётся). Перевыкатить.
   - После этого CF Dashboard → Workers & Pages → выбранный Worker → **Logs** покажет
     все `console.log` / `console.error` из обработчиков в реальном времени.
   - В dev можно `npx wrangler tail` локально, без observability.
   - Алёрт на массовые `error.code = 'P0001'` (rate-limit или атака) — через CF email-notifications
     или Logpush в свой канал.
   - Supabase Logs — Project Settings → Logs Retention (по умолчанию 1 день на Free, 7 на Pro).

7. **Фото / Storage** — решить про CDN для админ-загруженных фото (Supabase Storage / R2). См. §9a п. 1.

8. **Прогон миграций** — `supabase db push` на прод-инстанс, не `reset`. Перед этим — backup существующего состояния. Накатывать только новые миграции, не повторно.

---

## 10. Открытые вопросы (нужно решение до старта)

Принятые решения после правок:
- Категории **удаляются** (`DROP TABLE categories`). Сеты — верхний уровень каталога.
- **`stock_sets`** — название/локализация сета. **`stock_set_rules`** — правила
  (count, price, max_flavors) внутри сета.
- **`stock_set_items`** (M:M) — какие `stock_items` доступны в каждом сете
  (в админке выбирается, какие вкусы привязать).
- `order_items` ссылается **либо** на `stock_item_id`, **либо** на `stock_set_rule_id`
  (CHECK XOR). Состав сета в заказе — нормальная таблица `order_item_flavors`.
- Фото — отдельная таблица **`photos`**, только для фото вкусов
  (`stock_items.photo_id` → `photos.id`). Hero и галерея — статика на фронте,
  не БД, не API.
- Цена при оформлении считается **только на сервере** в `create_order`
  (из `stock_set_rules.price`).
- **API каталога** — единственный эндпойнт `GET /api/sets`, отдаёт массив `Set`
  с вложенными `items[]` и `rules[]`.

Остались:

1. **Локализация**: двух полей в БД (`*_ru` / `*_pt`) хватит, или хотим `translations JSONB`?
   Закладываю простые два поля.
2. **`MatDatepicker` vs `<input type="date">`**: Material уже подключен. По умолчанию
   беру `<input type="date">` — ближе к минимализму шаблона.
3. **Удалять ли папку `source/`** после переноса, или оставить как референс?
4. **Админка**: новые сущности (`stock_sets`, `stock_set_rules`, `stock_set_items`,
   `photos`) сейчас править нечем — нужна доработка `frontend/admin` + `backend/api`.
   В шаблоне нужно как минимум управление привязкой вкусов к сетам
   (`stock_set_items`). **Делать в эту итерацию или отложить?**
   Закладываю **отложить** — фокус только на shop, сидер пропишет данные руками.

---

После твоего «ок по плану» начну с **Этапа 1 (миграция БД)** — покажу SQL и попрошу
подтверждения перед `supabase db reset` / применением.
