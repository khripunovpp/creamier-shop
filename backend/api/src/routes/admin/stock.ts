import {Hono} from "hono";
import {zValidator} from '@hono/zod-validator'
import {Bindings, Variables} from "../../index";
import {createStockItemScheme} from "../../schemes/create-stock-item.scheme";

const stockRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

stockRoutes.get("/", async (c) => {
  const supabase = c.get("supabaseClient");

  if (!supabase) {
    return c.json({error: "Failed to fetch products"}, 500);
  }

  const {data, error} = await supabase.from("stock_items")
    .select("*")
    .order("created_at", {ascending: false});

  if (error) {
    return c.json({error: "Failed to fetch products"}, 500);
  }

  return c.json(data);
});

stockRoutes.post(
  '/',
  zValidator('json', createStockItemScheme),
  async (c) => {
    const supabase = c.get("supabaseClient");

    if (!supabase) {
      return c.json({error: "Failed to create product"}, 500);
    }

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

export default stockRoutes;