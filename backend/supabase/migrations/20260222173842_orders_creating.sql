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
  email text unique not null,
  name text,
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
  p_email text,
  p_name text,
  p_items jsonb
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
  v_price integer;
  v_cost_price integer;
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
  where email = lower(p_email);

  if v_user_id is null then
    insert into customers (email, name)
    values (lower(p_email), p_name)
    returning id into v_user_id;
  end if;


  -------------------------------------------------
  -- 3️⃣ Создание заказа
  -------------------------------------------------
  insert into orders (
    user_id,
    status,
    created_at
  )
  values (
    v_user_id,
    'created',
    v_now
  )
  returning id into v_order_id;


  -------------------------------------------------
  -- 4️⃣ Обработка товаров
  -------------------------------------------------
  for v_item in
    select * from jsonb_array_elements(p_items)
  loop

    select quantity, price, cost_price
    into v_stock, v_price, v_cost_price
    from stock_items
    where id = (v_item->>'id')::uuid
    for update;

    if v_stock is null then
      raise exception 'Product not found';
    end if;

    if v_stock < (v_item->>'quantity')::int then
      raise exception 'Not enough stock';
    end if;

    update stock_items
    set quantity = quantity - (v_item->>'quantity')::int
    where id = (v_item->>'id')::uuid;

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
      (v_item->>'quantity')::int,
      v_price,
      v_cost_price
    );

    insert into stock_movements (
      stock_item_id,
      quantity,
      operation,
      created_at
    )
    values (
      (v_item->>'id')::uuid,
      (v_item->>'quantity')::int,
      'make_order',
      v_now
    );

  end loop;

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