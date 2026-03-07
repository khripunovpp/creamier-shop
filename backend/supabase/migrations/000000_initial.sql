


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."order_status" AS ENUM (
    'created',
    'delivered',
    'cancelled',
    'returned',
    'paid'
);


ALTER TYPE "public"."order_status" OWNER TO "postgres";

CREATE TYPE "public"."order_delivery_type" AS ENUM (
    'pickup',
    'delivery'
);


ALTER TYPE "public"."order_delivery_type" OWNER TO "postgres";


CREATE TYPE "public"."stock_operation" AS ENUM (
    'add',
    'remove',
    'make_order'
);


ALTER TYPE "public"."stock_operation" OWNER TO "postgres";


CREATE TYPE "public"."stock_status" AS ENUM (
    'active',
    'stopped'
);


ALTER TYPE "public"."stock_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'customer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.users
    where id = auth.uid()
    and role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."order_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "changed_by" "uuid",
    "action" "text" NOT NULL,
    "payload" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."order_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "stock_item_id" "uuid",
    "price" numeric NOT NULL,
    "quantity" numeric NOT NULL,
    "cost_price" numeric NOT NULL,
    "is_service" boolean DEFAULT false
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TYPE "public"."payment_methods" AS ENUM ('cash', 'bank_transfer');

CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "delivery_date" timestamp with time zone,
    "delivery_info" "jsonb",
    "delivery_type" "public"."order_delivery_type" DEFAULT 'pickup'::"public"."order_delivery_type",
    "status" "public"."order_status" DEFAULT 'created'::"public"."order_status",
    "total_amount" numeric DEFAULT 0 NOT NULL,
    "discount_amount" numeric DEFAULT 0,
    "profit_amount" numeric DEFAULT 0,
    "payment_data" "text",
    "payment_method" "public"."payment_methods",
    "paid_at" timestamp with time zone,
    "comment" "text"
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric NOT NULL,
    "cost_price" numeric NOT NULL,
    "is_service" boolean DEFAULT false,
    "status" "public"."stock_status" DEFAULT 'active'::"public"."stock_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "stopped_at" timestamp with time zone,
    "category_id" "uuid",
    "badge" text CHECK ("badge" IN ('sale', 'hot')) DEFAULT NULL
);


ALTER TABLE "public"."stock_items" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."categories" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE "public"."categories" OWNER TO "postgres";

CREATE OR REPLACE VIEW "public"."public_products" WITH ("security_invoker"='false') AS
 SELECT "id",
    "name",
    "price",
    "description"
   FROM "public"."stock_items";


ALTER VIEW "public"."public_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_changes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stock_item_id" "uuid",
    "changed_by" "uuid",
    "payload" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stock_changes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stock_movements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stock_item_id" "uuid",
    "operation" "public"."stock_operation" NOT NULL,
    "quantity" numeric NOT NULL,
    "remain" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stock_movements" OWNER TO "postgres";


ALTER TABLE ONLY "public"."order_history"
    ADD CONSTRAINT "order_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_changes"
    ADD CONSTRAINT "stock_changes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_items"
    ADD CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_order_history_order" ON "public"."order_history" USING "btree" ("order_id");



CREATE INDEX "idx_order_items_order" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at");



CREATE INDEX "idx_orders_status" ON "public"."orders" USING "btree" ("status");



CREATE INDEX "idx_orders_user" ON "public"."orders" USING "btree" ("user_id");



CREATE INDEX "idx_stock_status" ON "public"."stock_items" USING "btree" ("status");



ALTER TABLE ONLY "public"."order_history"
    ADD CONSTRAINT "order_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id");



ALTER TABLE ONLY "public"."stock_changes"
    ADD CONSTRAINT "stock_changes_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_movements"
    ADD CONSTRAINT "stock_movements_stock_item_id_fkey" FOREIGN KEY ("stock_item_id") REFERENCES "public"."stock_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stock_items"
    ADD CONSTRAINT "stock_items_category_id_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;



CREATE POLICY "admin full access" ON "public"."order_history" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "admin full access" ON "public"."order_items" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "admin full access" ON "public"."orders" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "admin full access" ON "public"."stock_changes" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "admin full access" ON "public"."stock_items" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "admin full access" ON "public"."stock_movements" TO "authenticated" USING (true) WITH CHECK (true);


CREATE POLICY "admin full access" ON "public"."categories" TO "authenticated" USING (true) WITH CHECK (true);


ALTER TABLE "public"."order_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_changes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stock_movements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;



ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";


















GRANT ALL ON TABLE "public"."order_history" TO "anon";
GRANT ALL ON TABLE "public"."order_history" TO "authenticated";
GRANT ALL ON TABLE "public"."order_history" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."stock_items" TO "service_role";
GRANT SELECT ON TABLE "public"."stock_items" TO "anon";
GRANT SELECT ON TABLE "public"."stock_items" TO "authenticated";



GRANT ALL ON TABLE "public"."public_products" TO "anon";
GRANT ALL ON TABLE "public"."public_products" TO "authenticated";
GRANT ALL ON TABLE "public"."public_products" TO "service_role";



GRANT ALL ON TABLE "public"."stock_changes" TO "anon";
GRANT ALL ON TABLE "public"."stock_changes" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_changes" TO "service_role";



GRANT ALL ON TABLE "public"."stock_movements" TO "anon";
GRANT ALL ON TABLE "public"."stock_movements" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_movements" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































