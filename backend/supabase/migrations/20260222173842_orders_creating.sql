-- orders creating
-- enums for payment method
CREATE TYPE payment_methods AS ENUM ('cash', 'bank_transfer', 'card');

-- add delivery_info column, paid_at , payment_method is enum('cash', 'bank_transfer', 'card')
ALTER TABLE orders
    ADD COLUMN delivery_info JSONB,
ADD COLUMN paid_at timestamp with time zone,
ADD COLUMN payment_method payment_methods;


-- Добавляем таблицу для хранения информации о клиентах
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text unique,
    phone_number text unique,
    telegram text unique,
    whatsapp text unique,
  created_at timestamptz not null default now()
);

--- Добавляем таблицу для хранения информации о последнем заказе клиента
create table if not exists order_rate_limits (
  client_key text primary key,
  last_order_at timestamptz not null
);

-- Добавляем таблицу для хранения информации о товарах в заказе
ALTER TYPE "public"."stock_operation" ADD VALUE 'make_order';

-- Добавляем колонку remain в stock_movements
ALTER TABLE stock_movements
ADD COLUMN remain integer;

-- Создаём функцию для создания заказа с антиспамом и проверкой stock
create or replace function create_order(
  p_client_key text,
  p_name text,
  p_email text,
  p_phone_number text,
  p_telegram text,
  p_whatsapp text,
  p_items jsonb,
  p_delivery_date timestamptz,
  p_delivery_info jsonb,
  p_comment text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_order_id uuid;
  v_user_id uuid;
  v_item jsonb;
  v_now timestamptz := now();
  v_last_order timestamptz;
  v_stock integer;
  v_price numeric;
  v_cost_price numeric;
  v_total_amount numeric := 0;
  v_profit_amount numeric := 0;
  v_qty integer;
begin

  -------------------------------------------------
  -- 1️⃣ Anti-spam (с блокировкой строки)
  -------------------------------------------------
  select last_order_at
  into v_last_order
  from order_rate_limits
  where client_key = p_client_key
  for update;

  if found then
    if v_last_order > v_now - interval '1 minutes' then
      raise exception 'Rate limit: only 1 order per 1 minutes';
    end if;

    update order_rate_limits
    set last_order_at = v_now
    where client_key = p_client_key;
  else
    insert into order_rate_limits(client_key, last_order_at)
    values (p_client_key, v_now);
  end if;


  -------------------------------------------------
  -- 2️⃣ Найти или создать пользователя
  -------------------------------------------------
  select id
  into v_user_id
  from customers
  where email = lower(p_email)
      or phone_number = p_phone_number
      or telegram = p_telegram
      or whatsapp = p_whatsapp
  limit 1;

  if v_user_id is null then
    insert into customers (name, email, phone_number, telegram, whatsapp)
    values (p_name, lower(p_email), p_phone_number, p_telegram, p_whatsapp)
    returning id into v_user_id;
  end if;

  -------------------------------------------------
  -- 3️⃣ Создание заказа (total/profit будут обновлены после обработки товаров)
  -------------------------------------------------
  insert into orders (
    user_id,
    status,
    created_at,
    delivery_date,
    total_amount,
    profit_amount,
    comment,
    delivery_info
  )
  values (
    v_user_id,
    'created',
    v_now,
    p_delivery_date,
    0,
    0,
    p_comment,
    p_delivery_info
  )
  returning id into v_order_id;


  -------------------------------------------------
  -- 4️⃣ Обработка товаров
  -------------------------------------------------
  for v_item in
    select * from jsonb_array_elements(p_items)
  loop

    v_qty := (v_item->>'quantity')::int;

    -- Получаем цены из stock_items и блокируем строку
    select price, cost_price
    into v_price, v_cost_price
    from stock_items
    where id = (v_item->>'id')::uuid
    for update;

    if not found then
      raise exception 'Product not found: %', (v_item->>'id');
    end if;

    -- Получаем текущий остаток из последней записи stock_movements
    select remain
    into v_stock
    from stock_movements
    where stock_item_id = (v_item->>'id')::uuid
    order by created_at desc, id desc
    limit 1;

    -- Если движений ещё не было — остаток считаем 0
    if v_stock is null then
      v_stock := 0;
    end if;

    if v_stock < v_qty then
      raise exception 'Not enough stock for product %', (v_item->>'id');
    end if;

    insert into order_items (
      order_id,
      stock_item_id,
      quantity,
      price,
      cost_price
    )
    values (
      v_order_id,
      (v_item->>'id')::uuid,
      v_qty,
      v_price,
      v_cost_price
    );

    insert into stock_movements (
      stock_item_id,
      quantity,
      operation,
      created_at,
      remain
    )
    values (
      (v_item->>'id')::uuid,
      v_qty,
      'make_order',
      v_now,
      v_stock - v_qty
    );

    v_total_amount  := v_total_amount  + v_price      * v_qty;
    v_profit_amount := v_profit_amount + (v_price - v_cost_price) * v_qty;

  end loop;

  -------------------------------------------------
  -- 5️⃣ Обновляем итоговые суммы заказа
  -------------------------------------------------
  update orders
  set total_amount  = v_total_amount,
      profit_amount = v_profit_amount
  where id = v_order_id;

  return v_order_id;

end;
$$;

-- Добавляем внешний ключ к таблице orders
alter table orders
add constraint orders_user_id_fkey
foreign key (user_id)
references customers(id)
on delete set null;

-- Ограничиваем доступ к функции и разрешаем только аутентифицированным пользователям
revoke all on function create_order(text, text, text, jsonb) from public;
grant execute on function create_order(text, text, text, jsonb) to authenticated;


-- Включаем RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Политика для админа: полный доступ
CREATE POLICY "admin full access"
ON customers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-- Включаем RLS
ALTER TABLE order_rate_limits ENABLE ROW LEVEL SECURITY;

-- Политика для админа: полный доступ
CREATE POLICY "admin full access"
ON order_rate_limits
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);