import {Hono} from "hono";
import {zValidator} from '@hono/zod-validator';
import {Bindings, Variables} from "../../index";
import {stockSetRuleCreateScheme} from "../../schemes/stock-set-rule.scheme";

const stockSetRulesRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// GET /api/admin/stock-set-rules?set_id=<uuid> — list rules (optionally filtered by set)
stockSetRulesRoutes.get('/', async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to fetch rules"}, 500);
  const setId = c.req.query("set_id");

  let q = supabase.from("stock_set_rules")
    .select("*")
    .order("position", {ascending: true})
    .order("count", {ascending: true});
  if (setId) q = q.eq("set_id", setId);

  const {data, error} = await q;
  if (error) return c.json({error: "Failed to fetch rules"}, 500);
  return c.json(data);
});

// POST /api/admin/stock-set-rules/:set_id — create rule under a set
stockSetRulesRoutes.post('/:set_id', zValidator('json', stockSetRuleCreateScheme), async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to create rule"}, 500);
  const {set_id} = c.req.param();
  const body = c.req.valid('json');

  const {data, error} = await supabase.from("stock_set_rules")
    .insert({
      set_id,
      count: body.count,
      price: body.price,
      max_flavors: body.max_flavors,
      position: body.position,
    })
    .select("id").single();

  if (error) {
    if (error.code === '23505') return c.json({error: "Rule with this count already exists"}, 409);
    return c.json({error: "Failed to create rule"}, 500);
  }
  return c.json({id: data.id}, 201);
});

// Rules are immutable once created. To change a rule, delete it and create a new
// one — DELETE is blocked by FK if the rule is referenced by any order_item.

// DELETE /api/admin/stock-set-rules/:id — blocked by FK if referenced by orders.
stockSetRulesRoutes.delete('/:id', async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to delete rule"}, 500);
  const {id} = c.req.param();
  const {error} = await supabase.from("stock_set_rules").delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      return c.json({error: "Rule is referenced by existing orders and cannot be deleted"}, 409);
    }
    return c.json({error: "Failed to delete rule"}, 500);
  }
  return c.json({message: "Rule deleted"});
});

export default stockSetRulesRoutes;
