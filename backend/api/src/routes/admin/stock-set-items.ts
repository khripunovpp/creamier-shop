import {Hono} from "hono";
import {zValidator} from '@hono/zod-validator';
import {Bindings, Variables} from "../../index";
import {stockSetItemCreateScheme, stockSetItemUpdateScheme} from "../../schemes/stock-set-item.scheme";

const stockSetItemsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /api/admin/stock-set-items/:set_id — list flavors linked to a set
stockSetItemsRoutes.get('/:set_id', async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to fetch links"}, 500);
  const {set_id} = c.req.param();

  const {data, error} = await supabase.from("stock_set_items")
    .select("position, stock_item:stock_items(id, name, name_pt, status, photo_url)")
    .eq("set_id", set_id)
    .order("position", {ascending: true});

  if (error) return c.json({error: "Failed to fetch links"}, 500);
  return c.json(data);
});

// POST /api/admin/stock-set-items/:set_id — link a flavor to a set
stockSetItemsRoutes.post('/:set_id', zValidator('json', stockSetItemCreateScheme), async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to link flavor"}, 500);
  const {set_id} = c.req.param();
  const body = c.req.valid('json');

  const {error} = await supabase.from("stock_set_items").insert({
    set_id,
    stock_item_id: body.stock_item_id,
    position: body.position,
  });
  if (error) {
    if (error.code === '23505') return c.json({error: "Flavor already linked to this set"}, 409);
    return c.json({error: "Failed to link flavor"}, 500);
  }
  return c.json({message: "Flavor linked"}, 201);
});

// PUT /api/admin/stock-set-items/:set_id/:item_id — reorder
stockSetItemsRoutes.put('/:set_id/:item_id', zValidator('json', stockSetItemUpdateScheme), async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to update link"}, 500);
  const {set_id, item_id} = c.req.param();
  const body = c.req.valid('json');
  const {error} = await supabase.from("stock_set_items")
    .update({position: body.position})
    .eq('set_id', set_id).eq('stock_item_id', item_id);
  if (error) return c.json({error: "Failed to update link"}, 500);
  return c.json({message: "Link updated"});
});

// DELETE /api/admin/stock-set-items/:set_id/:item_id — unlink
stockSetItemsRoutes.delete('/:set_id/:item_id', async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to unlink flavor"}, 500);
  const {set_id, item_id} = c.req.param();
  const {error} = await supabase.from("stock_set_items")
    .delete().eq('set_id', set_id).eq('stock_item_id', item_id);
  if (error) return c.json({error: "Failed to unlink flavor"}, 500);
  return c.json({message: "Flavor unlinked"});
});

export default stockSetItemsRoutes;
