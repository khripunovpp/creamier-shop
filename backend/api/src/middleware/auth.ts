import {Context, Next} from "hono";
import {createSupabaseClient} from "../utils/supabse-client";

export async function requireAdmin(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return c.json({error: "Unauthorized"}, 401);
  }

  const supabase = createSupabaseClient(c);

  const {data, error} = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return c.json({error: "Unauthorized"}, 401);
  }

  // сохраняем юзера в контекст
  c.set("user", data.user);
  c.set("token", token);
  c.set("supabaseClient", supabase);
  await next();
}