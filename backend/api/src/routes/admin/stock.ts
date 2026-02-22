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

  const withArchived = c.req.query("withArchived") === "true";
  const statuesToFetch = withArchived
    ? ["active", "stopped", "archived"]
    : ["active", "stopped"];

  const {data, error} = await supabase.from("stock_items")
    .select("*")
    .in("status", statuesToFetch)
    .order("created_at", {ascending: false})

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

stockRoutes.post('/:id/archive', async (c) => {
  const supabase = c.get("supabaseClient");

  if (!supabase) {
    return c.json({error: "Failed to archive product"}, 500);
  }

  const {id} = c.req.param();

  const {error} = await supabase.from("stock_items")
    .update({
      status: 'archived',
      quantity: 0,
    })
    .eq('id', id);

  if (error) {
    return c.json({error: "Failed to archive product"}, 500);
  }

  return c.json({message: "Product archived successfully"});
});

stockRoutes.post('/:id/activate', async (c) => {
  const supabase = c.get("supabaseClient");

  if (!supabase) {
    return c.json({error: "Failed to activate product"}, 500);
  }

  const {id} = c.req.param();

  const {error} = await supabase.from("stock_items")
    .update({status: 'active'})
    .eq('id', id);

  if (error) {
    return c.json({error: "Failed to activate product"}, 500);
  }

  return c.json({message: "Product activated successfully"});
});

stockRoutes.post('/:id/deactivate', async (c) => {
  const supabase = c.get("supabaseClient");

  if (!supabase) {
    return c.json({error: "Failed to deactivate product"}, 500);
  }

  const {id} = c.req.param();

  const {error} = await supabase.from("stock_items")
    .update({status: 'stopped'})
    .eq('id', id);

  if (error) {
    return c.json({error: "Failed to deactivate product"}, 500);
  }

  return c.json({message: "Product deactivated successfully"});
});

export default stockRoutes;