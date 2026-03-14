import {Hono} from "hono";
import {Bindings} from "../index";
import {createClient} from "@supabase/supabase-js";
import {zValidator} from "@hono/zod-validator";
import {createOrderScheme} from "../schemes/create-order.scheme";
import {mapPgErrorMessage} from "../utils/pg-error-mapper";
import {cors} from "hono/cors";
import {bodyLimit} from "hono/body-limit";
import {csrfProtection} from "../middleware/csrf";

const publicRoutes = new Hono<{
  Bindings: Bindings;
}>();

publicRoutes.use("/*", bodyLimit({
  maxSize: 64 * 1024, // 64KB
  onError: (c) => c.json({error: "Request body too large"}, 413),
}));

publicRoutes.use("/*", cors({
  origin: (_origin, c) => c.env.CORS_ORIGIN,
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "X-CSRF-Token"],
  credentials: true,
}));

publicRoutes.get("/csrf", csrfProtection, (c) => {
  return c.json({ok: true});
});

publicRoutes.get("/products", async (c) => {
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_PUBLISHABLE_KEY,
  );

  const {data, error} = await supabase.from("public_products")
    .select("id, name, price, description, status, badge, category_name, available_quantity");

  if (error) {
    console.error("Failed to fetch products", {error});
    return c.json({error: "Failed to fetch products"}, 500);
  }

  return c.json(data);
});

publicRoutes.get("/products/:id", async (c) => {
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_PUBLISHABLE_KEY,
  );

  const {id} = c.req.param();

  const {data, error} = await supabase.from("public_products")
    .select("id, name, price, description, status, badge, category_name, available_quantity")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to fetch product", {error});
    return c.json({error: "Failed to fetch product"}, 500);
  }

  return c.json(data);
});

publicRoutes.post(
  "/orders/create",
  csrfProtection,
  zValidator('json', createOrderScheme),
  async (c) => {
    const supabase = createClient(
      c.env.SUPABASE_URL,
      c.env.SUPABASE_PUBLISHABLE_KEY,
    );

    const clientIp = c.req.header('CF-Connecting-IP')
      ?? (c.env.DEV_MODE === 'true' ? '127.0.0.1' : null);

    if (!clientIp) {
      return c.json({error: "Forbidden"}, 403);
    }

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

    console.log("Creating order", {
      clientIp,
      name,
      email,
      phone_number,
      telegram,
      whatsapp,
      items,
      delivery_date,
      delivery_info,
      delivery_type,
    });

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

    console.log("Order created", {data: data, clientIp});

    return c.json({
      orderId: data,
    });
  });

export default publicRoutes;