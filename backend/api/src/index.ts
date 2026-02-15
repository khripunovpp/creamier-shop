import {Hono} from "hono";
import {cors} from "hono/cors";
import adminRoutes from "./routes/admin/orders";
import loginRoutes from "./routes/auth/login";
import ordersPublicRoutes from "./routes/public/orders";
import {User} from "@supabase/supabase-js";

export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  JWT_SECRET: string;
  TG_BOT_TOKEN: string;
  TG_SECRET: string;
};

export type Variables = {
  user?: User
};

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

app.use("/api/admin/*", cors({
  origin: "http://localhost:4200", // твой фронт
  allowMethods: ["GET", "POST", "OPTIONS"],
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

// Health check
app.get("/", (c) => c.text("Creamier API running 🧁"));

// Подключаем роуты
// app.route("/api/public", publicRoutes);
app.route("/api/public", ordersPublicRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/auth", loginRoutes);
// app.route("/api/telegram", telegramRoutes);

export default app;