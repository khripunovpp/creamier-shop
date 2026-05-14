import {Hono} from "hono";
import {cors} from "hono/cors";
import stockRoutes from "./routes/admin/stock";
import loginRoutes from "./routes/auth/login";
import {SupabaseClient, User} from "@supabase/supabase-js";
import {requireAdmin} from "./middleware/auth";
import ordersRoutes from "./routes/admin/orders";
import stockSetsRoutes from "./routes/admin/stock-sets";
import stockSetRulesRoutes from "./routes/admin/stock-set-rules";
import stockSetItemsRoutes from "./routes/admin/stock-set-items";

export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  JWT_SECRET: string;
  TG_BOT_TOKEN: string;
  TG_SECRET: string;
  CORS_ORIGIN: string;
};

export type Variables = {
  user?: User
  token?: string
  supabaseClient?: SupabaseClient
};

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

app.use("/api/admin/*", cors({
  origin: (_origin, c) => c.env.CORS_ORIGIN,
  allowMethods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  allowHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  credentials: true,
}));

app.use("/api/auth/*", cors({
  origin: (_origin, c) => c.env.CORS_ORIGIN,
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  credentials: true,
}));

// app.use("/api/admin/*", csrfProtection);
// app.use("/api/auth/*", csrfProtection);
app.use("/api/admin/*", requireAdmin);

// Health check
app.get("/", (c) => c.text("Creamier API running 🧁"));

// Подключаем роуты
app.route("/api/admin/products",        stockRoutes);
app.route("/api/admin/orders",          ordersRoutes);
app.route("/api/admin/stock-sets",      stockSetsRoutes);
app.route("/api/admin/stock-set-rules", stockSetRulesRoutes);
app.route("/api/admin/stock-set-items", stockSetItemsRoutes);
app.route("/api/auth",                  loginRoutes);

export default app;