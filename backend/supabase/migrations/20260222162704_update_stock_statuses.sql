ALTER TYPE "public"."stock_status" ADD VALUE 'archived';

DROP VIEW IF EXISTS public.public_products;

CREATE OR REPLACE VIEW public.public_products AS
SELECT
    si.id,
    si.name,
    si.price,
    si.description,
    si.status,
    si.badge,
    c.name AS category_name,
    COALESCE(sm.remain, 0) AS available_quantity
FROM stock_items si
LEFT JOIN categories c ON c.id = si.category_id
LEFT JOIN LATERAL (
    SELECT remain
    FROM stock_movements sm
    WHERE sm.stock_item_id = si.id
    ORDER BY sm.created_at DESC
    LIMIT 1
) sm ON true
WHERE si.status = 'active'
AND si.is_service = false;