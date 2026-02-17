import {Hono} from "hono";
import {requireAdmin} from "../../middleware/auth";
import {Bindings, Variables} from "../../index";
import {createClient} from "@supabase/supabase-js";
import {zValidator} from '@hono/zod-validator'
import {createStockItemScheme} from "../../schemes/create-stock-item.scheme";

const adminRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

adminRoutes.use("*", requireAdmin);

adminRoutes.get("/products", async (c) => {
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_KEY,
  );

  const {data, error} = await supabase.from("stock_items")
    .select("*")
    .order("created_at", {ascending: false});

  if (error) {
    return c.json({error: "Failed to fetch products"}, 500);
  }

  return c.json(data);
});


adminRoutes.post(
  '/products',
  zValidator('json', createStockItemScheme),
  async (c) => {
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_SERVICE_KEY,
    );

    const requestData = c.req.valid('json');

    const {data, error} = await supabase.from("stock_items")
      .insert(requestData)
      .select("*")
      .single();

    if (error) {
      return c.json({error: "Failed to create product"}, 500);
    }

    return c.json({
      id: data.id,
    }, 201);
  }
);

export default adminRoutes;