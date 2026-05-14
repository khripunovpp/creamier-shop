-- ─────────────────────────────────────────────────────────────────────────────
-- private.admin_create_order: server-side order creation from admin (manual
-- phone order). Differs from public.create_order: no rate-limit, accepts initial
-- status, discount, payment_method, paid_at. Same price/flavor validation.
-- Lives in `private` since the admin api client defaults to schema='private'.
-- ─────────────────────────────────────────────────────────────────────────────

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
  v_flavor_ids    uuid[];
  v_flavor_id     uuid;
  v_qty           integer;
  v_total         numeric := 0;
  v_position      integer;
  v_order_item_id uuid;
  v_valid_count   integer;
BEGIN
  -- 1) Find or create customer (no rate limit for admin context)
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

  -- 2) Create the order shell with admin-supplied initial state
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

  -- 3) Process items (same validation as public.create_order)
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

    INSERT INTO private.order_items (
      order_id, stock_set_rule_id, quantity, price, cost_price
    ) VALUES (
      v_order_id, v_rule.id, v_qty, v_rule.price, 0
    )
    RETURNING id INTO v_order_item_id;

    v_position := 0;
    FOREACH v_flavor_id IN ARRAY v_flavor_ids LOOP
      INSERT INTO private.order_item_flavors (
        order_item_id, stock_item_id, position
      ) VALUES (v_order_item_id, v_flavor_id, v_position);
      v_position := v_position + 1;
    END LOOP;

    v_total := v_total + v_rule.price * v_qty;
  END LOOP;

  -- 4) Finalize total
  UPDATE private.orders
     SET total_amount = v_total
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
