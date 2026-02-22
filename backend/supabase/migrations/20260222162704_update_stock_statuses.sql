ALTER TYPE "public"."stock_status" ADD VALUE 'archived';

CREATE
OR REPLACE VIEW "public"."public_products" WITH ("security_invoker"='false') AS
SELECT "id",
       "name",
       "price",
       "description",
       "status",
       "quantity"
FROM "public"."stock_items"
WHERE "status" = 'active';