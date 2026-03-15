import {Hono} from "hono";
import {Bindings, Variables} from "../../index";
import {requireAdmin} from "../../middleware/auth";
import {createSupabaseClient} from "../../utils/supabse-client";

const loginRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

loginRoutes.use("/me", requireAdmin);

loginRoutes.post("/login", async (c) => {
  const {email, password} = await c.req.json();

  const supabase = createSupabaseClient(c);

  const {data, error} = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return c.json({error: "Invalid credentials"}, 401);
  }

  return c.json({token: data.session.access_token});
});

loginRoutes.get("/me", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({error: "Unauthorized"}, 401);
  }

  return c.json({
    email: user.email,
    id: user.id,
  });
});

export default loginRoutes;