import {Hono} from "hono";
import {Bindings, Variables} from "../../index";
import {createClient} from "@supabase/supabase-js";
import {getConnInfo} from 'hono/cloudflare-workers'

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

  console.log("Fetched products", {data, error});

  if (error) {
    return c.json({error: "Failed to fetch products"}, 500);
  }

  return c.json(data);
});

ordersPublicRoutes.get("/products/:id", async (c) => {
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_PUBLISHABLE_KEY,
  );

  const {id} = c.req.param();

  const {data, error} = await supabase.from("public_products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return c.json({error: "Failed to fetch product"}, 500);
  }

  return c.json(data);
});

// TODO validation, error handling, logging
ordersPublicRoutes.post("/orders/create", async (c) => {
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_PUBLISHABLE_KEY,
  );

  const info = getConnInfo(c);

  const {
    items,
    email,
    name,
    delivery_date,
    delivery_info,
    comment,
    phone_number,
    telegram,
    whatsapp,
  } = await c.req.json();

  const {data, error} = await supabase.rpc("create_order", {
    p_client_key: info.remote.address,
    p_name: name,
    p_email: email,
    p_phone_number: phone_number,
    p_telegram: telegram,
    p_whatsapp: whatsapp,
    p_items: items,
    p_delivery_date: delivery_date,
    p_delivery_info: delivery_info,
    p_comment: comment,
  });
  if (error) {
    console.error("Order creation failed (internal)", error);

    if (error.code === "P0001") {
      return c.json({
        error: error.message
      }, 400);
    }

    return c.json({error: "Failed to create order"}, 500);
  }


  return c.json({
    orderId: data,
  });
});

export default ordersPublicRoutes;