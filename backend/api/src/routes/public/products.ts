import {Hono} from "hono";
import {Bindings, Variables} from "../../index";
import {createClient} from "@supabase/supabase-js";

const ordersPublicRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

ordersPublicRoutes.get("/products", async (c) => {
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_PUBLISHABLE_KEY,
  );

  const {data, error} = await supabase.from("public_products")
    .select("*");

  console.log({error})

  if (error) {
    return c.json({error: "Failed to fetch products"}, 500);
  }

  return c.json(data);
});

export default ordersPublicRoutes;