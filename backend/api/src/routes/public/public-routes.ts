import {Hono} from "hono";
import {Bindings, Variables} from "../../index";
import {createClient} from "@supabase/supabase-js";
import {zValidator} from "@hono/zod-validator";
import {createOrderScheme} from "../../schemes/create-order.scheme";
import {mapPgErrorMessage} from "../../utils/pg-error-mapper";

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

  if (error) {
    console.error("Failed to fetch products", {error});
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
    console.error("Failed to fetch product", {error});
    return c.json({error: "Failed to fetch product"}, 500);
  }

  return c.json(data);
});

ordersPublicRoutes.post(
  "/orders/create",
  zValidator('json', createOrderScheme),
  async (c) => {
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_PUBLISHABLE_KEY,
    );

    const clientIp = c.req.header('CF-Connecting-IP')
      ?? c.req.header('X-Forwarded-For')
      ?? 'unknown';

    const {
      items,
      email,
      name,
      delivery_date,
      delivery_info,
      delivery_type,
      comment,
      phone_number,
      telegram,
      whatsapp,
    } = c.req.valid('json');

    const {data, error} = await supabase.rpc("create_order", {
      p_client_key: clientIp,
      p_name: name,
      p_email: email,
      p_phone_number: phone_number,
      p_telegram: telegram,
      p_whatsapp: whatsapp,
      p_items: items,
      p_delivery_date: delivery_date,
      p_delivery_info: delivery_info,
      p_delivery_type: delivery_type,
      p_comment: comment,
    });
    if (error) {
      console.error("Order creation failed (internal)", error);

      if (error.code === "P0001") {
        return c.json({
          error: mapPgErrorMessage(error.message)
        }, 400);
      }

      return c.json({error: "Failed to create order"}, 500);
    }

    return c.json({
      orderId: data,
    });
  });

export default ordersPublicRoutes;