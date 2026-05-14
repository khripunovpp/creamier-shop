import {Context, Hono} from "hono";
import {zValidator} from '@hono/zod-validator';
import {Bindings, Variables} from "../../index";
import {stockSetScheme, updateStockSetScheme} from "../../schemes/stock-set.scheme";

const stockSetsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const SELECT_FULL = `
  *,
  rules:stock_set_rules(id, count, price, max_flavors, position),
  items:stock_set_items(stock_item_id, position, stock_item:stock_items(id, name, name_pt, status))
`;

stockSetsRoutes.get('/', async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to fetch sets"}, 500);

  const withArchived = c.req.query("withArchived") === "true";
  const statuses = withArchived ? ["active", "stopped", "archived"] : ["active", "stopped"];

  const {data, error} = await supabase.from("stock_sets")
    .select(SELECT_FULL)
    .in("status", statuses)
    .order("position", {ascending: true})
    .order("created_at", {ascending: false});

  if (error) return c.json({error: "Failed to fetch sets"}, 500);
  return c.json(data);
});

stockSetsRoutes.get('/:id', async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to fetch set"}, 500);
  const {id} = c.req.param();

  const {data, error} = await supabase.from("stock_sets")
    .select(SELECT_FULL).eq("id", id).single();
  if (error) return c.json({error: "Failed to fetch set"}, 500);
  return c.json(data);
});

stockSetsRoutes.post('/', zValidator('json', stockSetScheme), async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to create set"}, 500);
  const body = c.req.valid('json');

  const {data, error} = await supabase.from("stock_sets")
    .insert({
      slug: body.slug,
      name_ru: body.name_ru,
      name_pt: body.name_pt,
      description_ru: body.description_ru ?? null,
      description_pt: body.description_pt ?? null,
      status: body.status,
      position: body.position,
    })
    .select("id").single();

  if (error) {
    console.error("Failed to create set", error);
    if (error.code === '23505') return c.json({error: "Slug already exists"}, 409);
    return c.json({error: "Failed to create set"}, 500);
  }
  return c.json({id: data.id}, 201);
});

stockSetsRoutes.put('/:id', zValidator('json', updateStockSetScheme), async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to update set"}, 500);
  const {id} = c.req.param();
  const body = c.req.valid('json');

  const {error} = await supabase.from("stock_sets").update(body).eq('id', id);
  if (error) {
    if (error.code === '23505') return c.json({error: "Slug already exists"}, 409);
    return c.json({error: "Failed to update set"}, 500);
  }
  return c.json({message: "Set updated"});
});

function statusAction(status: 'archived' | 'active' | 'stopped') {
  return async (c: Context) => {
    const supabase = c.get("supabaseClient");
    if (!supabase) return c.json({error: `Failed to ${status}`}, 500);
    const {id} = c.req.param();
    const {error} = await supabase.from("stock_sets").update({status}).eq('id', id);
    if (error) return c.json({error: `Failed to ${status}`}, 500);
    return c.json({message: `Set ${status}`});
  };
}

stockSetsRoutes.post('/:id/archive', statusAction('archived'));
stockSetsRoutes.post('/:id/activate', statusAction('active'));
stockSetsRoutes.post('/:id/deactivate', statusAction('stopped'));

export default stockSetsRoutes;
