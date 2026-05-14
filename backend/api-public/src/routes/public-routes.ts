import {Hono} from "hono";
import {Bindings} from "../index";
import {createClient} from "@supabase/supabase-js";
import {zValidator} from "@hono/zod-validator";
import {createOrderScheme} from "../schemes/create-order.scheme";
import {mapPgErrorMessage} from "../utils/pg-error-mapper";
import {cors} from "hono/cors";
import {bodyLimit} from "hono/body-limit";

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


publicRoutes.get("/sets", async (c) => {
  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_PUBLISHABLE_KEY,
  );

  const {data, error} = await supabase
    .from("public_sets")
    .select("id, slug, name_ru, name_pt, description_ru, description_pt, position, items, rules")
    .order("position", {ascending: true});

  if (error) {
    console.error("Failed to fetch sets", {error});
    return c.json({error: "Failed to fetch sets"}, 500);
  }

  c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=600");

  return c.json(data);
});

publicRoutes.post(
  "/orders/create",
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
      contact_channel,
      name,
      email,
      phone_number,
      telegram,
      whatsapp,
      delivery_date,
      delivery_time,
      delivery_info,
      delivery_type,
      comment,
    } = c.req.valid('json');

    // Only the field matching the chosen channel reaches the DB — server-side
    // enforcement of "exactly one contact". Schema's refine() already checked
    // the chosen value is non-empty.
    const contact = {
      email:        contact_channel === 'email'    ? email        : null,
      phone_number: contact_channel === 'phone'    ? phone_number : null,
      telegram:     contact_channel === 'telegram' ? telegram     : null,
      whatsapp:     contact_channel === 'whatsapp' ? whatsapp     : null,
    };

    // delivery_time + the chosen channel piggy-back on delivery_info JSONB so
    // the RPC signature stays stable.
    const enrichedDeliveryInfo = {
      ...(delivery_info ?? {}),
      ...(delivery_time ? {time: delivery_time} : {}),
      contact_channel,
    };

    const {data, error} = await supabase.rpc("create_order", {
      p_client_key:    clientIp,
      p_name:          name,
      p_email:         contact.email,
      p_phone_number:  contact.phone_number,
      p_telegram:      contact.telegram,
      p_whatsapp:      contact.whatsapp,
      p_items:         items,
      p_delivery_date: delivery_date,
      p_delivery_info: enrichedDeliveryInfo,
      p_delivery_type: delivery_type,
      p_comment:       comment,
    });

    if (error) {
      console.error("Order creation failed (internal)", error);

      if (error.code === "P0001") {
        return c.json({error: mapPgErrorMessage(error.message)}, 400);
      }

      return c.json({error: "Failed to create order"}, 500);
    }

    return c.json({orderId: data});
  });

export default publicRoutes;