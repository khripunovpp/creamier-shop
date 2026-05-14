-- ─────────────────────────────────────────────────────────────────────────────
-- Populate order_items.cost_price and orders.profit_amount on order creation.
--
-- stock_items.cost_price is per piece. A box of `count` pieces with N selected
-- flavors splits those pieces evenly across flavors, so:
--   cost_per_box = (count / N) * SUM(stock_items.cost_price for those flavors)
-- order_items.cost_price stores that cost basis per box.
-- orders.profit_amount = SUM((order_items.price - order_items.cost_price) * quantity)
-- — actual margin, matching legacy semantics before the sets migration.
--
-- Rewrites public.create_order, private.admin_create_order, and
-- private.admin_add_order_item; signatures unchanged.
-- ─────────────────────────────────────────────────────────────────────────────


DROP FUNCTION IF EXISTS public.create_order(
  text, text, text, text, text, text, jsonb, timestamptz, jsonb,
  public.order_delivery_type, text
);

CREATE FUNCTION public.create_order(
  p_client_key    text,
  p_name          text,
  p_email         text,
  p_phone_number  text,
  p_telegram      text,
  p_whatsapp      text,
  p_items         jsonb,
  p_delivery_date timestamptz,
  p_delivery_info jsonb,
  p_delivery_type public.order_delivery_type,
  p_comment       text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id      uuid;
  v_user_id       uuid;
  v_item          jsonb;
  v_now           timestamptz := now();
  v_last_order    timestamptz;
  v_rule          private.stock_set_rules%ROWTYPE;
  v_set_slug      text;
  v_flavor_ids    uuid[];
  v_flavor_id     uuid;
  v_qty           integer;
  v_total_amount  numeric := 0;
  v_total_profit  numeric := 0;
  v_item_cost     numeric;
  v_position      integer;
  v_order_item_id uuid;
  v_valid_count   integer;
BEGIN
  -- anti-spam: 1 order / minute per client_key
  SELECT last_order_at INTO v_last_order
    FROM private.order_rate_limits
   WHERE client_key = p_client_key
     FOR UPDATE;

  IF FOUND THEN
    IF v_last_order > v_now - interval '1 minute' THEN
      RAISE EXCEPTION 'Rate limit: only 1 order per 1 minutes';
    END IF;
    UPDATE private.order_rate_limits
       SET last_order_at = v_now
     WHERE client_key = p_client_key;
  ELSE
    INSERT INTO private.order_rate_limits (client_key, last_order_at)
    VALUES (p_client_key, v_now);
  END IF;

  -- find or create customer
  SELECT id INTO v_user_id
    FROM private.customers
   WHERE (p_email        IS NOT NULL AND email        = lower(p_email))
      OR (p_phone_number IS NOT NULL AND phone_number = p_phone_number)
      OR (p_telegram     IS NOT NULL AND telegram     = p_telegram)
      OR (p_whatsapp     IS NOT NULL AND whatsapp     = p_whatsapp)
   LIMIT 1;

  IF v_user_id IS NULL THEN
    INSERT INTO private.customers (name, email, phone_number, telegram, whatsapp)
    VALUES (p_name, lower(p_email), p_phone_number, p_telegram, p_whatsapp)
    RETURNING id INTO v_user_id;
  END IF;

  INSERT INTO private.orders (
    user_id, status, created_at, delivery_date,
    total_amount, profit_amount, comment, delivery_info, delivery_type
  ) VALUES (
    v_user_id, 'created', v_now, p_delivery_date,
    0, 0, p_comment, p_delivery_info, p_delivery_type
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::int;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;

    SELECT array_agg(value::uuid) INTO v_flavor_ids
      FROM jsonb_array_elements_text(v_item->'flavor_ids') AS value;
    IF v_flavor_ids IS NULL OR array_length(v_flavor_ids, 1) IS NULL THEN
      RAISE EXCEPTION 'Missing flavors';
    END IF;

    SELECT * INTO v_rule
      FROM private.stock_set_rules
     WHERE id = (v_item->>'stock_set_rule_id')::uuid
       FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid set rule';
    END IF;

    IF array_length(v_flavor_ids, 1) > v_rule.max_flavors THEN
      RAISE EXCEPTION 'Too many flavors for this set rule';
    END IF;

    SELECT count(*) INTO v_valid_count
      FROM private.stock_set_items
     WHERE set_id        = v_rule.set_id
       AND stock_item_id = ANY (v_flavor_ids);
    IF v_valid_count <> array_length(v_flavor_ids, 1) THEN
      RAISE EXCEPTION 'Invalid flavor for this set';
    END IF;

    SELECT slug INTO v_set_slug FROM private.stock_sets WHERE id = v_rule.set_id;

    SELECT (v_rule.count::numeric / array_length(v_flavor_ids, 1)::numeric)
           * COALESCE(SUM(cost_price), 0)
      INTO v_item_cost
      FROM private.stock_items
     WHERE id = ANY (v_flavor_ids);

    INSERT INTO private.order_items (
      order_id, quantity, price, cost_price, set_slug, set_count
    ) VALUES (
      v_order_id, v_qty, v_rule.price, v_item_cost, v_set_slug, v_rule.count
    )
    RETURNING id INTO v_order_item_id;

    v_position := 0;
    FOREACH v_flavor_id IN ARRAY v_flavor_ids LOOP
      INSERT INTO private.order_item_flavors (
        order_item_id, stock_item_id, position
      ) VALUES (v_order_item_id, v_flavor_id, v_position);
      v_position := v_position + 1;
    END LOOP;

    v_total_amount := v_total_amount + v_rule.price * v_qty;
    v_total_profit := v_total_profit + (v_rule.price - v_item_cost) * v_qty;
  END LOOP;

  UPDATE private.orders
     SET total_amount  = v_total_amount,
         profit_amount = v_total_profit
   WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(
  text, text, text, text, text, text, jsonb, timestamptz, jsonb,
  public.order_delivery_type, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(
  text, text, text, text, text, text, jsonb, timestamptz, jsonb,
  public.order_delivery_type, text
) TO anon, authenticated;


-- admin_create_order — same cost/profit logic
DROP FUNCTION IF EXISTS private.admin_create_order(
  text, text, text, text, text, jsonb, timestamptz, jsonb,
  public.order_delivery_type, text, public.order_status,
  numeric, public.payment_methods, timestamptz
);

CREATE FUNCTION private.admin_create_order(
  p_name            text,
  p_email           text,
  p_phone_number    text,
  p_telegram        text,
  p_whatsapp        text,
  p_items           jsonb,
  p_delivery_date   timestamptz,
  p_delivery_info   jsonb,
  p_delivery_type   public.order_delivery_type,
  p_comment         text,
  p_status          public.order_status     DEFAULT 'created',
  p_discount_amount numeric                 DEFAULT 0,
  p_payment_method  public.payment_methods  DEFAULT NULL,
  p_paid_at         timestamptz             DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id      uuid;
  v_user_id       uuid;
  v_item          jsonb;
  v_rule          private.stock_set_rules%ROWTYPE;
  v_set_slug      text;
  v_flavor_ids    uuid[];
  v_flavor_id     uuid;
  v_qty           integer;
  v_total         numeric := 0;
  v_total_profit  numeric := 0;
  v_item_cost     numeric;
  v_position      integer;
  v_order_item_id uuid;
  v_valid_count   integer;
BEGIN
  SELECT id INTO v_user_id
    FROM private.customers
   WHERE (p_email        IS NOT NULL AND email        = lower(p_email))
      OR (p_phone_number IS NOT NULL AND phone_number = p_phone_number)
      OR (p_telegram     IS NOT NULL AND telegram     = p_telegram)
      OR (p_whatsapp     IS NOT NULL AND whatsapp     = p_whatsapp)
   LIMIT 1;

  IF v_user_id IS NULL THEN
    INSERT INTO private.customers (name, email, phone_number, telegram, whatsapp)
    VALUES (p_name, lower(p_email), p_phone_number, p_telegram, p_whatsapp)
    RETURNING id INTO v_user_id;
  END IF;

  INSERT INTO private.orders (
    user_id, status, created_at, delivery_date,
    total_amount, discount_amount, profit_amount,
    comment, delivery_info, delivery_type,
    payment_method, paid_at
  ) VALUES (
    v_user_id, p_status, now(), p_delivery_date,
    0, p_discount_amount, 0,
    p_comment, p_delivery_info, p_delivery_type,
    p_payment_method, p_paid_at
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_qty := (v_item->>'quantity')::int;
    IF v_qty IS NULL OR v_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity';
    END IF;

    SELECT array_agg(value::uuid) INTO v_flavor_ids
      FROM jsonb_array_elements_text(v_item->'flavor_ids') AS value;
    IF v_flavor_ids IS NULL OR array_length(v_flavor_ids, 1) IS NULL THEN
      RAISE EXCEPTION 'Missing flavors';
    END IF;

    SELECT * INTO v_rule
      FROM private.stock_set_rules
     WHERE id = (v_item->>'stock_set_rule_id')::uuid
       FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invalid set rule';
    END IF;

    IF array_length(v_flavor_ids, 1) > v_rule.max_flavors THEN
      RAISE EXCEPTION 'Too many flavors for this set rule';
    END IF;

    SELECT count(*) INTO v_valid_count
      FROM private.stock_set_items
     WHERE set_id        = v_rule.set_id
       AND stock_item_id = ANY (v_flavor_ids);
    IF v_valid_count <> array_length(v_flavor_ids, 1) THEN
      RAISE EXCEPTION 'Invalid flavor for this set';
    END IF;

    SELECT slug INTO v_set_slug FROM private.stock_sets WHERE id = v_rule.set_id;

    SELECT (v_rule.count::numeric / array_length(v_flavor_ids, 1)::numeric)
           * COALESCE(SUM(cost_price), 0)
      INTO v_item_cost
      FROM private.stock_items
     WHERE id = ANY (v_flavor_ids);

    INSERT INTO private.order_items (
      order_id, quantity, price, cost_price, set_slug, set_count
    ) VALUES (
      v_order_id, v_qty, v_rule.price, v_item_cost, v_set_slug, v_rule.count
    )
    RETURNING id INTO v_order_item_id;

    v_position := 0;
    FOREACH v_flavor_id IN ARRAY v_flavor_ids LOOP
      INSERT INTO private.order_item_flavors (
        order_item_id, stock_item_id, position
      ) VALUES (v_order_item_id, v_flavor_id, v_position);
      v_position := v_position + 1;
    END LOOP;

    v_total        := v_total        + v_rule.price * v_qty;
    v_total_profit := v_total_profit + (v_rule.price - v_item_cost) * v_qty;
  END LOOP;

  UPDATE private.orders
     SET total_amount  = v_total,
         profit_amount = v_total_profit
   WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION private.admin_create_order(
  text, text, text, text, text, jsonb, timestamptz, jsonb,
  public.order_delivery_type, text, public.order_status,
  numeric, public.payment_methods, timestamptz
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.admin_create_order(
  text, text, text, text, text, jsonb, timestamptz, jsonb,
  public.order_delivery_type, text, public.order_status,
  numeric, public.payment_methods, timestamptz
) TO authenticated, service_role;


-- admin_add_order_item — single-item version, re-aggregates the order totals
DROP FUNCTION IF EXISTS private.admin_add_order_item(uuid, uuid, uuid[], integer);

CREATE FUNCTION private.admin_add_order_item(
  p_order_id          uuid,
  p_stock_set_rule_id uuid,
  p_flavor_ids        uuid[],
  p_quantity          integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rule          private.stock_set_rules%ROWTYPE;
  v_set_slug      text;
  v_valid_count   integer;
  v_order_item_id uuid;
  v_flavor_id     uuid;
  v_position      integer;
  v_item_cost     numeric;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;
  IF p_flavor_ids IS NULL OR array_length(p_flavor_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Missing flavors';
  END IF;

  PERFORM 1 FROM private.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  SELECT * INTO v_rule
    FROM private.stock_set_rules
   WHERE id = p_stock_set_rule_id
     FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid set rule'; END IF;

  IF array_length(p_flavor_ids, 1) > v_rule.max_flavors THEN
    RAISE EXCEPTION 'Too many flavors for this set rule';
  END IF;

  SELECT count(*) INTO v_valid_count
    FROM private.stock_set_items
   WHERE set_id        = v_rule.set_id
     AND stock_item_id = ANY (p_flavor_ids);
  IF v_valid_count <> array_length(p_flavor_ids, 1) THEN
    RAISE EXCEPTION 'Invalid flavor for this set';
  END IF;

  SELECT slug INTO v_set_slug FROM private.stock_sets WHERE id = v_rule.set_id;

  SELECT (v_rule.count::numeric / array_length(p_flavor_ids, 1)::numeric)
         * COALESCE(SUM(cost_price), 0)
    INTO v_item_cost
    FROM private.stock_items
   WHERE id = ANY (p_flavor_ids);

  INSERT INTO private.order_items (
    order_id, quantity, price, cost_price, set_slug, set_count
  ) VALUES (
    p_order_id, p_quantity, v_rule.price, v_item_cost, v_set_slug, v_rule.count
  )
  RETURNING id INTO v_order_item_id;

  v_position := 0;
  FOREACH v_flavor_id IN ARRAY p_flavor_ids LOOP
    INSERT INTO private.order_item_flavors (order_item_id, stock_item_id, position)
    VALUES (v_order_item_id, v_flavor_id, v_position);
    v_position := v_position + 1;
  END LOOP;

  UPDATE private.orders
     SET total_amount  = (
       SELECT COALESCE(SUM(price * quantity), 0)
         FROM private.order_items
        WHERE order_id = p_order_id
     ),
         profit_amount = (
       SELECT COALESCE(SUM((price - cost_price) * quantity), 0)
         FROM private.order_items
        WHERE order_id = p_order_id
     )
   WHERE id = p_order_id;

  RETURN v_order_item_id;
END;
$$;

REVOKE ALL ON FUNCTION private.admin_add_order_item(uuid, uuid, uuid[], integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.admin_add_order_item(uuid, uuid, uuid[], integer)
  TO authenticated, service_role;
