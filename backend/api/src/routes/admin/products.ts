import {Hono} from "hono";
import {requireAdmin} from "../../middleware/auth";
import {Bindings, Variables} from "../../index";
import {createClient} from "@supabase/supabase-js";

const adminRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

adminRoutes.use("*", requireAdmin);

adminRoutes.get("/products", async (c) => {
  const adminJwt = c.get("token");
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_PUBLISHABLE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${adminJwt}`,
        },
      },
    }
  );

  const {data, error} = await supabase.from("stock_items")
    .select("*")
    .order("created_at", {ascending: false});

  if (error) {
    return c.json({error: "Failed to fetch products"}, 500);
  }

  return c.json(data);
});

export default adminRoutes;