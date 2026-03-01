-- Add badge column to stock_items
-- Possible values: 'sale', 'hot', or NULL (no badge)
ALTER TABLE "public"."stock_items"
  ADD COLUMN IF NOT EXISTS "badge" text CHECK ("badge" IN ('sale', 'hot')) DEFAULT NULL;

