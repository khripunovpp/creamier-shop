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

  const accessToken = data.session.access_token;

  return c.json({success: true}, {
    headers: {
      "Set-Cookie": `admin_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`
    }
  });
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