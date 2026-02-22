import {createClient, SupabaseClient} from "@supabase/supabase-js";
import {Context} from "hono";

export const createSupabaseClient = (c: Context): SupabaseClient => {
  return createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_KEY
  );
};