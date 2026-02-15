import {Context, Next} from "hono";
import {getCookie} from "hono/cookie";
import {createClient} from "@supabase/supabase-js";

export async function requireAdmin(c: Context, next: Next) {
  const token = getCookie(c, "admin_token");

  if (!token) {
    return c.json({error: "Unauthorized"}, 401);
  }

  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_KEY
  );

  const {data, error} = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return c.json({error: "Unauthorized"}, 401);
  }

  // сохраняем юзера в контекст
  c.set("user", data.user);

  await next();
}