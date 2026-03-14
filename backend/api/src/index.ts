import {Hono} from "hono";
import {cors} from "hono/cors";
import stockRoutes from "./routes/admin/stock";
import categoriesRoutes from "./routes/admin/categories";
import loginRoutes from "./routes/auth/login";
import productsPublicRoutes from "./routes/public/public-routes";
import {SupabaseClient, User} from "@supabase/supabase-js";
import {requireAdmin} from "./middleware/auth";
import ordersRoutes from "./routes/admin/orders";

export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  JWT_SECRET: string;
  TG_BOT_TOKEN: string;
  TG_SECRET: string;
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
  origin: "http://localhost:4200", // твой фронт
  allowMethods: ["GET", "POST", "OPTIONS", "PUT", "DELETE"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use("/api/auth/*", cors({
  origin: "http://localhost:4200", // твой фронт
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use("/api/public/*", cors({
  origin: "http://localhost:4201", // твой фронт
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use("/api/admin/*", requireAdmin);

// Health check
app.get("/", (c) => c.text("Creamier API running 🧁"));

// Подключаем роуты
app.route("/api/public", productsPublicRoutes);
app.route("/api/admin/products", stockRoutes);
app.route("/api/admin/categories", categoriesRoutes);
app.route("/api/admin/orders", ordersRoutes);
app.route("/api/auth", loginRoutes);

export default app;