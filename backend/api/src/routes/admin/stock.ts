import {Hono} from "hono";
import {zValidator} from '@hono/zod-validator'
import {Bindings, Variables} from "../../index";
import {stockScheme, updateStockItemScheme} from "../../schemes/stock.scheme";

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
    .order("created_at", {ascending: false});

  const stockItemsWithMovements = await Promise.all(data?.map(async (item) => {
    const {data: movements} = await supabase.from("stock_movements")
      .select("*")
      .eq("stock_item_id", item.id)
      .order("created_at", {ascending: false})
      .limit(1)
      .single();

    return {
      ...item,
      quantity: movements?.remain || 0,
    };
  }) || []);

  if (error) {
    return c.json({error: "Failed to fetch products"}, 500);
  }

  return c.json(stockItemsWithMovements);
});

stockRoutes.get("/:id", async (c) => {
  const supabase = c.get("supabaseClient");

  if (!supabase) {
    return c.json({error: "Failed to fetch product"}, 500);
  }

  const {id} = c.req.param();

  const {data, error} = await supabase.from("stock_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return c.json({error: "Failed to fetch product"}, 500);
  }

  return c.json(data);
});

stockRoutes.post(
  '/',
  zValidator('json', stockScheme),
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

stockRoutes.put(
  '/:id',
  zValidator('json', updateStockItemScheme),
  async (c) => {
    const supabase = c.get("supabaseClient");

    if (!supabase) {
      return c.json({error: "Failed to update product"}, 500);
    }

    const {id} = c.req.param();
    const requestData = c.req.valid('json');

    const {error} = await supabase.from("stock_items")
      .update(requestData)
      .eq('id', id);

    if (error) {
      return c.json({error: "Failed to update product"}, 500);
    }

    return c.json({message: "Product updated successfully"});
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

stockRoutes.post('/:id/move', async (c) => {
  const supabase = c.get("supabaseClient");

  if (!supabase) {
    return c.json({error: "Failed to move stock item"}, 500);
  }

  const {id} = c.req.param();
  const {quantity, operation} = await c.req.json();

  const {data: currentItem, error: fetchError} = await supabase.from("stock_items")
    .select("id")
    .eq('id', id)
    .single();

  if (fetchError) {
    return c.json({error: "Failed to fetch product"}, 500);
  }
  if (!currentItem) {
    return c.json({error: "Product not found"}, 404);
  }

  let newQuantity = 0;
  const {error: movementRecordDataError, data: movementRecordData} = await supabase.from("stock_movements")
    .select("*")
    .eq("stock_item_id", id)
    .order("created_at", {ascending: false})
    .limit(1);

  if (movementRecordDataError) {
    return c.json({error: "Failed to fetch stock movement data"}, 500);
  }

  if (movementRecordData && movementRecordData.length > 0) {
    newQuantity = movementRecordData[0].remain;
  }

  if (operation === 'add') {
    newQuantity = newQuantity + quantity;
  } else if (operation === 'remove') {
    newQuantity = Math.max(0, newQuantity - quantity);
  } else {
    return c.json({error: "Invalid operation"}, 400);
  }

  const {error: updateError, data: insertedRow} = await supabase.from("stock_movements")
    .insert({
      stock_item_id: id,
      quantity: quantity,
      operation,
      remain: newQuantity,
    });

  if (updateError) {
    return c.json({error: "Failed to move stock item"}, 500);
  }

  return c.json({message: "Stock item moved successfully"});
});

export default stockRoutes;