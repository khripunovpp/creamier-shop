-- ─────────────────────────────────────────────────────────────────────────────
-- Drop photos table, inline URL onto stock_items.photo_url.
-- Admin will pick the file from a build-time manifest of frontend/shop/public/photos/
-- contents — no per-photo metadata (alt_*) needed (shop uses flavor name as alt).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) New column on stock_items
ALTER TABLE private.stock_items
  ADD COLUMN photo_url text;

-- 2) Migrate existing data from photos table via the FK
UPDATE private.stock_items si
   SET photo_url = p.url
  FROM private.photos p
 WHERE p.id = si.photo_id;

-- 3) Drop the view that references stock_items.photo_id (so the column can be dropped).
DROP VIEW IF EXISTS public.public_sets;

-- 4) Now safe to drop the column
ALTER TABLE private.stock_items
  DROP COLUMN photo_id;

-- 5) Recreate the view, inline photo_url, no photos join
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
        'photo_url', i.photo_url
      )
      ORDER BY ssi.position, i.position
    )
    FROM private.stock_set_items ssi
    JOIN private.stock_items     i ON i.id = ssi.stock_item_id AND i.status = 'active'
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

-- 6) Drop photos table
DROP TABLE private.photos;
