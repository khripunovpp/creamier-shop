import {Hono} from "hono";
import {Bindings, Variables} from "../../index";

const ordersPublicRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

ordersPublicRoutes.get("/products", async (c) => {
  return c.json([
    {
      id: 1,
      name: "Product 1",
      price: 10,
      availableQuantity: 100,
    },
    {
      id: 2,
      name: "Product 2",
      price: 20,
      availableQuantity: 50,
    }
  ]);
});

export default ordersPublicRoutes;