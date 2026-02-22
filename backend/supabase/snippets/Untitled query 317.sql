DROP VIEW IF EXISTS public.public_products;


CREATE OR REPLACE VIEW public.public_products AS
SELECT
    si.id,
    si.name,
    si.price,
    si.description,
    si.status,
    COALESCE(sm.remain, 0) AS quantity
FROM stock_items si
LEFT JOIN LATERAL (
    SELECT remain
    FROM stock_movements sm
    WHERE sm.stock_item_id = si.id
    ORDER BY sm.created_at DESC
    LIMIT 1
) sm ON true
WHERE si.status = 'active';