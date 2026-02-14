import {Hono} from "hono";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {Bindings, Variables} from "../../index";
import {createClient} from "@supabase/supabase-js";
import {requireAdmin} from "../../middleware/auth";
import adminRoutes from "../admin/orders";

const loginRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

loginRoutes.post("/login", async (c) => {
  const {email, password} = await c.req.json();

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);

  // 1️⃣ Получаем admin из Supabase
  const {data: admin, error} = await supabase.from('admin_users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !admin) return c.json({error: "Invalid credentials"}, 401);

  // 2️⃣ Проверяем пароль
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return c.json({error: "Invalid credentials"}, 401);

  // 3️⃣ Генерируем JWT
  const token = jwt.sign(
    {id: admin.id, role: "admin"},
    c.env.JWT_SECRET,
    {expiresIn: "12h"}
  );

  // 4️⃣ Отдаём токен через httpOnly cookie
  return c.json({success: true}, {
    headers: {
      "Set-Cookie": `admin_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`
    }
  });
});

loginRoutes.use("/me", requireAdmin);

loginRoutes.post("/me", async (c) => {
  const adminId = c.get("adminId");

  const supabase = createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);

  const {data: admin, error} = await supabase.from('admin_users')
    .select('id, email')
    .eq('id', adminId)
    .single();

  if (error || !admin) return c.json({error: "Admin not found"}, 404);

  return c.json({admin});
});

export default loginRoutes;