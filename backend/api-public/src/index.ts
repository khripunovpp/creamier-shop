import {Hono} from "hono";
import publicRoutes from "./routes/public-routes";

export type Bindings = {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
  CORS_ORIGIN: string;
  DEV_MODE?: string;
};

const app = new Hono<{
  Bindings: Bindings;
}>();

app.route("/api", publicRoutes);

export default app;