import {Hono} from "hono";
import {Bindings, Variables} from "../../index";

const ordersRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

ordersRoutes.get("/", async (c) => {
  const supabase = c.get("supabaseClient");

  if (!supabase) {
    return c.json({error: "Failed to fetch orders"}, 500);
  }

  const {data, error} = await supabase.from("orders")
    .select("*")
    .order("created_at", {ascending: false})

  if (error) {
    return c.json({error: "Failed to fetch orders"}, 500);
  }

  return c.json(data);
});

ordersRoutes.get("/:id", async (c) => {
  const supabase = c.get("supabaseClient");

  if (!supabase) {
    return c.json({error: "Failed to fetch order"}, 500);
  }

  const {id} = c.req.param();

  const {data, error} = await supabase.from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return c.json({error: "Failed to fetch order"}, 500);
  }

  return c.json(data);
});

export default ordersRoutes;