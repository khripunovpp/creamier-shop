import {Hono} from "hono";
import {Bindings, Variables} from "../../index";
import {createClient} from "@supabase/supabase-js";
import {requireAdmin} from "../../middleware/auth";

const loginRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();
loginRoutes.post("/login", async (c) => {
  const {email, password} = await c.req.json();

  const supabase = createClient(
    c.env.SUPABASE_URL,
    c.env.SUPABASE_SERVICE_KEY,
  );

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

loginRoutes.use("/me", requireAdmin);

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