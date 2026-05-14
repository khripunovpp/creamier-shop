import {Hono} from "hono";
import {zValidator} from '@hono/zod-validator';
import {Bindings, Variables} from "../../index";
import {stockScheme, updateStockItemScheme} from "../../schemes/stock.scheme";

const stockRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

const SELECT_FIELDS = '*';

stockRoutes.get("/", async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) {
    console.error("GET /api/admin/products: no supabase client in context");
    return c.json({error: "Failed to fetch products"}, 500);
  }

  const withArchived = c.req.query("withArchived") === "true";
  const statuses = withArchived ? ["active", "stopped", "archived"] : ["active", "stopped"];

  const {data, error} = await supabase.from("stock_items")
    .select(SELECT_FIELDS)
    .in("status", statuses)
    .order("status", {ascending: true})
    .order("position", {ascending: true})
    .order("created_at", {ascending: false});

  if (error) {
    console.error("GET /api/admin/products: stock_items query failed", error);
    return c.json({error: "Failed to fetch products"}, 500);
  }

  // Inventory quantity is still tracked via stock_movements (legacy).
  // For made-to-order flavors this is typically 0; keep the join for back-compat.
  const itemsWithQty = await Promise.all((data ?? []).map(async (item) => {
    const {data: movement, error: moveErr} = await supabase.from("stock_movements")
      .select("remain")
      .eq("stock_item_id", item.id)
      .order("created_at", {ascending: false})
      .limit(1)
      .maybeSingle();
    if (moveErr) console.error("GET /api/admin/products: stock_movements query failed", {item_id: item.id, err: moveErr});
    return {...item, quantity: movement?.remain ?? 0};
  }));

  return c.json(itemsWithQty);
});

stockRoutes.get("/:id", async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to fetch product"}, 500);

  const {id} = c.req.param();

  const {data, error} = await supabase.from("stock_items")
    .select(SELECT_FIELDS)
    .eq("id", id)
    .single();

  if (error) return c.json({error: "Failed to fetch product"}, 500);
  return c.json(data);
});

stockRoutes.post('/', zValidator('json', stockScheme), async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to create product"}, 500);

  const body = c.req.valid('json');
  const {data, error} = await supabase.from("stock_items")
    .insert({
      name: body.name,
      name_pt: body.name_pt,
      detail_ru: body.detail_ru ?? null,
      detail_pt: body.detail_pt ?? null,
      tags_ru: body.tags_ru ?? null,
      tags_pt: body.tags_pt ?? null,
      photo_url: body.photo_url ?? null,
      position: body.position,
      price: body.price,
      cost_price: body.cost_price,
      status: body.status,
      badge: body.badge ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create product", error);
    return c.json({error: "Failed to create product"}, 500);
  }
  console.log("Product created", {id: data.id, adminId: c.get("user")?.id});
  return c.json({id: data.id}, 201);
});

stockRoutes.put('/:id', zValidator('json', updateStockItemScheme), async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to update product"}, 500);

  const {id} = c.req.param();
  const body = c.req.valid('json');

  // Only fields actually present in the request are sent to the DB; the rest stay untouched.
  const {error} = await supabase.from("stock_items").update(body).eq('id', id);

  if (error) {
    console.error("Failed to update product", error);
    return c.json({error: "Failed to update product"}, 500);
  }
  console.log("Product updated", {id, adminId: c.get("user")?.id});
  return c.json({message: "Product updated successfully"});
});

stockRoutes.post('/:id/archive', async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to archive product"}, 500);
  const {id} = c.req.param();
  const {error} = await supabase.from("stock_items").update({status: 'archived'}).eq('id', id);
  if (error) return c.json({error: "Failed to archive product"}, 500);
  return c.json({message: "Product archived successfully"});
});

stockRoutes.post('/:id/activate', async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to activate product"}, 500);
  const {id} = c.req.param();
  const {error} = await supabase.from("stock_items").update({status: 'active'}).eq('id', id);
  if (error) return c.json({error: "Failed to activate product"}, 500);
  return c.json({message: "Product activated successfully"});
});

stockRoutes.post('/:id/deactivate', async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to deactivate product"}, 500);
  const {id} = c.req.param();
  const {error} = await supabase.from("stock_items").update({status: 'stopped'}).eq('id', id);
  if (error) return c.json({error: "Failed to deactivate product"}, 500);
  return c.json({message: "Product deactivated successfully"});
});

stockRoutes.post('/:id/move', async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to move stock item"}, 500);

  const {id} = c.req.param();
  const {quantity, operation} = await c.req.json();

  const {data: current, error: fetchError} = await supabase.from("stock_items")
    .select("id").eq('id', id).single();
  if (fetchError) return c.json({error: "Failed to fetch product"}, 500);
  if (!current) return c.json({error: "Product not found"}, 404);

  const {data: lastMove} = await supabase.from("stock_movements")
    .select("remain")
    .eq("stock_item_id", id)
    .order("created_at", {ascending: false})
    .limit(1)
    .maybeSingle();

  let remain = lastMove?.remain ?? 0;
  if (operation === 'add') remain = remain + Number(quantity);
  else if (operation === 'remove') remain = Math.max(0, remain - Number(quantity));
  else return c.json({error: "Invalid operation"}, 400);

  const {error} = await supabase.from("stock_movements").insert({
    stock_item_id: id,
    quantity: Number(quantity),
    operation,
    remain,
  });
  if (error) return c.json({error: "Failed to move stock item"}, 500);

  return c.json({message: "Stock item moved successfully"});
});

export default stockRoutes;
