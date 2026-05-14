-- ─────────────────────────────────────────────────────────────────────────────
-- Sets model: replace categories with stock_sets/stock_set_rules/stock_set_items,
-- move admin tables to `private` schema, expose only public.public_sets and
-- public.create_order to the anon role.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- 1.1  Cleanup old: drop the public_products view, stock_items.category_id,
--      and the categories table.
-- ─────────────────────────────────────────────────────────────────────────────

DROP VIEW IF EXISTS public.public_products;

ALTER TABLE public.stock_items DROP CONSTRAINT IF EXISTS stock_items_category_id_id_fkey;
ALTER TABLE public.stock_items DROP COLUMN IF EXISTS category_id;

DROP TABLE IF EXISTS public.categories;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1.2  Create the `private` schema and grant usage.
--      anon         → no access at all (must go through public.public_sets / public.create_order)
--      authenticated → schema USAGE + table CRUD (RLS policies on each table filter rows)
--      service_role  → full access (current admin api uses SERVICE_KEY)
--
--      Both authenticated and service_role grants are set so a future migration of
--      admin routes from SERVICE_KEY to user-JWT works without re-granting.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS private;

GRANT USAGE ON SCHEMA private TO authenticated, service_role;

-- service_role (admin api today)
GRANT ALL ON ALL TABLES    IN SCHEMA private TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA private TO service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA private TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA private
  GRANT ALL ON TABLES    TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA private
  GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA private
  GRANT ALL ON ROUTINES  TO service_role;

-- authenticated (future, when admin moves to user JWT — RLS policies filter rows)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA private TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES               IN SCHEMA private TO authenticated;
GRANT EXECUTE ON ALL ROUTINES                      IN SCHEMA private TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA private
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES    TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA private
  GRANT USAGE, SELECT                  ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA private
  GRANT EXECUTE                        ON ROUTINES  TO authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1.3  Move existing admin tables from public → private.
--      ALTER ... SET SCHEMA carries column defs, constraints (PK/FK/CHECK/UNIQUE),
--      indexes, triggers, RLS policies and "RLS enabled" flag, and table-level
--      grants. FK between these tables survive because they all land in private.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.stock_items       SET SCHEMA private;
ALTER TABLE public.orders            SET SCHEMA private;
ALTER TABLE public.order_items       SET SCHEMA private;
ALTER TABLE public.order_history     SET SCHEMA private;
ALTER TABLE public.stock_changes     SET SCHEMA private;
ALTER TABLE public.stock_movements   SET SCHEMA private;
ALTER TABLE public.customers         SET SCHEMA private;
ALTER TABLE public.order_rate_limits SET SCHEMA private;

-- Revoke grants that were attached to these tables for anon/PUBLIC in the public
-- schema (see 000000_initial.sql). SET SCHEMA carries grants along; we strip
-- anon's direct access so it must go through public.public_sets / public.create_order.
REVOKE ALL ON TABLE
  private.stock_items, private.orders, private.order_items, private.order_history,
  private.stock_changes, private.stock_movements, private.customers,
  private.order_rate_limits
FROM anon, PUBLIC;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1.4  New tables in `private`.
--      Pattern follows existing tables: RLS enabled + "admin full access" policy
--      TO authenticated. service_role bypasses RLS; anon has no schema grant.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1.4.1  stock_sets — products ("Tartlets", "Eclairs")
CREATE TABLE private.stock_sets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            text NOT NULL UNIQUE,
  name_ru         text NOT NULL,
  name_pt         text NOT NULL,
  description_ru  text,
  description_pt  text,
  status          stock_status NOT NULL DEFAULT 'active',
  position        int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.stock_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin full access" ON private.stock_sets
  TO authenticated USING (true) WITH CHECK (true);

-- 1.4.2  stock_set_rules — pricing rules per set (count + price + max_flavors)
CREATE TABLE private.stock_set_rules (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id       uuid NOT NULL REFERENCES private.stock_sets(id) ON DELETE CASCADE,
  count        int NOT NULL CHECK (count > 0),
  price        numeric(10,2) NOT NULL CHECK (price >= 0),
  max_flavors  int NOT NULL DEFAULT 1 CHECK (max_flavors > 0),
  position     int NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (set_id, count)
);
CREATE INDEX stock_set_rules_set_position_idx
  ON private.stock_set_rules (set_id, position);
ALTER TABLE private.stock_set_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin full access" ON private.stock_set_rules
  TO authenticated USING (true) WITH CHECK (true);

-- 1.4.3  photos — product photos only (hero/gallery are static frontend assets)
CREATE TABLE private.photos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url         text NOT NULL,
  alt_ru      text,
  alt_pt      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin full access" ON private.photos
  TO authenticated USING (true) WITH CHECK (true);

-- 1.4.4  stock_set_items — M:M between sets and flavors (admin decides which
--        flavors are available in which set)
CREATE TABLE private.stock_set_items (
  set_id         uuid NOT NULL REFERENCES private.stock_sets(id)  ON DELETE CASCADE,
  stock_item_id  uuid NOT NULL REFERENCES private.stock_items(id) ON DELETE CASCADE,
  position       int NOT NULL DEFAULT 0,
  PRIMARY KEY (set_id, stock_item_id)
);
CREATE INDEX stock_set_items_set_position_idx
  ON private.stock_set_items (set_id, position);
ALTER TABLE private.stock_set_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin full access" ON private.stock_set_items
  TO authenticated USING (true) WITH CHECK (true);

-- 1.4.5  order_item_flavors — flavors picked inside an ordered set box
CREATE TABLE private.order_item_flavors (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id   uuid NOT NULL REFERENCES private.order_items(id) ON DELETE CASCADE,
  stock_item_id   uuid NOT NULL REFERENCES private.stock_items(id) ON DELETE RESTRICT,
  position        int NOT NULL DEFAULT 0
);
CREATE INDEX order_item_flavors_order_item_idx
  ON private.order_item_flavors (order_item_id);
ALTER TABLE private.order_item_flavors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin full access" ON private.order_item_flavors
  TO authenticated USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- 1.5  Extend stock_items (flavor metadata + photo) and order_items (link to
--      a stock_set_rule, XOR with stock_item_id).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1.5.1  stock_items: localization, tags, photo, ordering
ALTER TABLE private.stock_items
  ADD COLUMN name_pt   text,
  ADD COLUMN detail_ru text,
  ADD COLUMN detail_pt text,
  ADD COLUMN tags_ru   text[],
  ADD COLUMN tags_pt   text[],
  ADD COLUMN photo_id  uuid REFERENCES private.photos(id) ON DELETE SET NULL,
  ADD COLUMN position  int NOT NULL DEFAULT 0;

-- 1.5.2  order_items: a line references either a single stock_item (legacy /
--         future per-piece sales) or a stock_set_rule (the box being ordered).
--         Exactly one of them is non-null.
ALTER TABLE private.order_items
  ALTER COLUMN stock_item_id DROP NOT NULL;

ALTER TABLE private.order_items
  ADD COLUMN stock_set_rule_id uuid REFERENCES private.stock_set_rules(id);

ALTER TABLE private.order_items
  ADD CONSTRAINT order_items_target_chk
    CHECK ((stock_item_id IS NOT NULL) <> (stock_set_rule_id IS NOT NULL));


-- ─────────────────────────────────────────────────────────────────────────────
-- 1.6  Public read view: public.public_sets.
--      Aggregates a set with its flavors (items) and rules into one row per
--      set, so the shop frontend gets the whole catalog in one GET /api/sets.
--      security_invoker = false: the view runs with owner privileges so anon can
--      SELECT it without having access to the private.* base tables.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE VIEW public.public_sets
WITH (security_invoker = false) AS
SELECT
  s.id,
  s.slug,
  s.name_ru,
  s.name_pt,
  s.description_ru,
  s.description_pt,
  s.position,
  COALESCE((
    SELECT json_agg(
      json_build_object(
        'id',        i.id,
        'name_ru',   i.name,
        'name_pt',   i.name_pt,
        'detail_ru', i.detail_ru,
        'detail_pt', i.detail_pt,
        'tags_ru',   i.tags_ru,
        'tags_pt',   i.tags_pt,
        'photo',     CASE
                       WHEN p.id IS NOT NULL THEN
                         json_build_object(
                           'url',    p.url,
                           'alt_ru', p.alt_ru,
                           'alt_pt', p.alt_pt
                         )
                       ELSE NULL
                     END
      )
      ORDER BY ssi.position, i.position
    )
    FROM private.stock_set_items ssi
    JOIN private.stock_items     i ON i.id = ssi.stock_item_id AND i.status = 'active'
    LEFT JOIN private.photos     p ON p.id = i.photo_id
    WHERE ssi.set_id = s.id
  ), '[]'::json) AS items,
  COALESCE((
    SELECT json_agg(
      json_build_object(
        'id',          r.id,
        'count',       r.count,
        'price',       r.price,
        'max_flavors', r.max_flavors
      )
      ORDER BY r.position, r.count
    )
    FROM private.stock_set_rules r
    WHERE r.set_id = s.id
  ), '[]'::json) AS rules
FROM private.stock_sets s
WHERE s.status = 'active'
ORDER BY s.position;

ALTER VIEW public.public_sets OWNER TO postgres;

GRANT SELECT ON public.public_sets TO anon, authenticated, service_role;


-- ─────────────────────────────────────────────────────────────────────────────
-- 1.7  Rewrite create_order under the new sets model.
--      - p_items shape: [{ stock_set_rule_id, flavor_ids[], quantity }, ...]
--      - price always taken from private.stock_set_rules (never client-provided)
--      - flavors validated against private.stock_set_items (must belong to the
--        rule's set)
--      - SECURITY DEFINER + SET search_path = '' + all refs fully qualified, to
--        block search_path hijacking. pg_catalog stays implicitly first, so
--        built-ins (now, lower, jsonb_array_elements, …) still resolve.
-- ─────────────────────────────────────────────────────────────────────────────

DROP FUNCTION IF EXISTS public.create_order(
  text, text, text, text, text, text, jsonb, timestamptz, jsonb, public.order_delivery_type, text
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
  v_flavor_ids    uuid[];
  v_flavor_id     uuid;
  v_qty           integer;
  v_total_amount  numeric := 0;
  v_position      integer;
  v_order_item_id uuid;
  v_valid_count   integer;
BEGIN
  -- 1) anti-spam: 1 order/minute per client_key, row-locked
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

  -- 2) find or create the customer (NULLs in input never match)
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

  -- 3) create the order shell (total filled at the end)
  INSERT INTO private.orders (
    user_id, status, created_at, delivery_date,
    total_amount, profit_amount, comment, delivery_info, delivery_type
  ) VALUES (
    v_user_id, 'created', v_now, p_delivery_date,
    0, 0, p_comment, p_delivery_info, p_delivery_type
  )
  RETURNING id INTO v_order_id;

  -- 4) iterate items
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

    v_total_amount := v_total_amount + v_rule.price * v_qty;
  END LOOP;

  -- 5) finalize totals. profit_amount stays 0 for set orders in this iteration:
  --    a cost basis per flavor across sets is out of scope.
  UPDATE private.orders
     SET total_amount = v_total_amount
   WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(
  text, text, text, text, text, text, jsonb, timestamptz, jsonb, public.order_delivery_type, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_order(
  text, text, text, text, text, text, jsonb, timestamptz, jsonb, public.order_delivery_type, text
) TO anon, authenticated;
