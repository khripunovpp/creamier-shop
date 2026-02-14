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
    },
    {
      id: 3,
      name: "Product 3",
      price: 30,
      availableQuantity: 25,
    },
    {
      id: 4,
      name: "Product 4",
      price: 40,
      availableQuantity: 10,
    },
    {
      id: 5,
      name: "Product 5",
      price: 50,
      availableQuantity: 5,
    }
  ]);
});

export default ordersPublicRoutes;