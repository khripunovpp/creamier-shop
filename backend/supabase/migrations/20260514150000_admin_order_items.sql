-- ─────────────────────────────────────────────────────────────────────────────
-- Three admin RPCs for editing an order's item lines. Each one recomputes
-- private.orders.total_amount atomically. Same flavor/rule validation as
-- create_order; price is always pulled from stock_set_rules (never client).
-- ─────────────────────────────────────────────────────────────────────────────


-- 1) Add a new order line.
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
  v_valid_count   integer;
  v_order_item_id uuid;
  v_flavor_id     uuid;
  v_position      integer;
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

  INSERT INTO private.order_items (
    order_id, stock_set_rule_id, quantity, price, cost_price
  ) VALUES (
    p_order_id, v_rule.id, p_quantity, v_rule.price, 0
  )
  RETURNING id INTO v_order_item_id;

  v_position := 0;
  FOREACH v_flavor_id IN ARRAY p_flavor_ids LOOP
    INSERT INTO private.order_item_flavors (order_item_id, stock_item_id, position)
    VALUES (v_order_item_id, v_flavor_id, v_position);
    v_position := v_position + 1;
  END LOOP;

  UPDATE private.orders
     SET total_amount = (
       SELECT COALESCE(SUM(price * quantity), 0)
         FROM private.order_items
        WHERE order_id = p_order_id
     )
   WHERE id = p_order_id;

  RETURN v_order_item_id;
END;
$$;


-- 2) Update quantity on an existing line. Rule + flavors are immutable per
--    line — to change them, delete and re-add.
CREATE FUNCTION private.admin_update_order_item(
  p_order_item_id uuid,
  p_quantity      integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  SELECT order_id INTO v_order_id
    FROM private.order_items
   WHERE id = p_order_item_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order item not found'; END IF;

  UPDATE private.order_items
     SET quantity = p_quantity
   WHERE id = p_order_item_id;

  UPDATE private.orders
     SET total_amount = (
       SELECT COALESCE(SUM(price * quantity), 0)
         FROM private.order_items
        WHERE order_id = v_order_id
     )
   WHERE id = v_order_id;
END;
$$;


-- 3) Delete a line. order_item_flavors cascades via FK ON DELETE CASCADE.
CREATE FUNCTION private.admin_delete_order_item(
  p_order_item_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order_id uuid;
BEGIN
  SELECT order_id INTO v_order_id
    FROM private.order_items
   WHERE id = p_order_item_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order item not found'; END IF;

  DELETE FROM private.order_items WHERE id = p_order_item_id;

  UPDATE private.orders
     SET total_amount = (
       SELECT COALESCE(SUM(price * quantity), 0)
         FROM private.order_items
        WHERE order_id = v_order_id
     )
   WHERE id = v_order_id;
END;
$$;


REVOKE ALL ON FUNCTION private.admin_add_order_item(uuid, uuid, uuid[], integer)    FROM PUBLIC;
REVOKE ALL ON FUNCTION private.admin_update_order_item(uuid, integer)                FROM PUBLIC;
REVOKE ALL ON FUNCTION private.admin_delete_order_item(uuid)                         FROM PUBLIC;

GRANT EXECUTE ON FUNCTION private.admin_add_order_item(uuid, uuid, uuid[], integer)    TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.admin_update_order_item(uuid, integer)                TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.admin_delete_order_item(uuid)                         TO authenticated, service_role;
