import {Hono} from "hono";
import {requireAdmin} from "../../middleware/auth";
import {Bindings, Variables} from "../../index";

const adminRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// Все admin маршруты защищены
adminRoutes.use("*", requireAdmin);

adminRoutes.get("/orders", async (c) => {
  const adminId = c.get("adminId");

  return c.json({
    message: "Admin orders",
    adminId,
  });
});

export default adminRoutes;