import {Hono} from "hono";
import {Bindings, Variables} from "../../index";
import {canMarkDelivered, canMarkPaidDelivered, canMarkPaidUndelivered, orderIsDelivered} from "./helpers/orders";

const ordersRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

ordersRoutes.get("/", async (c) => {
  const supabase = c.get("supabaseClient");

  if (!supabase) {
    return c.json({error: "Failed to fetch orders"}, 500);
  }

  const {data, error} = await supabase.from("orders")
    .select("*")
    .order("created_at", {ascending: false})

  if (error) {
    return c.json({error: "Failed to fetch orders"}, 500);
  }

  return c.json(data);
});

ordersRoutes.get("/:id", async (c) => {
  const supabase = c.get("supabaseClient");

  if (!supabase) {
    return c.json({error: "Failed to fetch order"}, 500);
  }

  const {id} = c.req.param();

  const {data, error} = await supabase.from("orders")
    .select(`
      *,
      items:order_items (stock_item_id, quantity, price, cost_price, is_service),
      customer:customers (name, email,phone_number,telegram,whatsapp)
    `)
    .eq("id", id)
    .single();


  if (error) {
    console.error("Failed to fetch order", error);
    return c.json({error: "Failed to fetch order"}, 500);
  }

  return c.json(data);
});

// TODO validation, error handling, logging
ordersRoutes.post('/:id/mark_paid', async (c) => {
  const supabase = c.get("supabaseClient");

  if (!supabase) {
    return c.json({error: "Failed to read order"}, 500);
  }

  const {id: orderId} = c.req.param();

  const {
    payment_method,
    payment_data,
  } = await c.req.json();

  const {data: order, error} = await supabase.from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Failed to read order", error);
    return c.json({error: "Failed to read order"}, 500);
  }

  if (!order) {
    return c.json({error: "Order not found"}, 404);
  }

  if (order.paid_at) {
    return c.json({error: "Order is already paid"}, 400);
  }

  const isDelivered = orderIsDelivered(order);

  if (isDelivered) {
    const canMarkPaid = canMarkPaidDelivered(order);

    if (canMarkPaid) {
      const {data, error} = await supabase.from("orders")
        .update({
          payment_method,
          payment_data,
          paid_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select("*")
        .single();

      if (error) {
        console.error("Failed to update order status", error);
        return c.json({error: "Failed to update order status"}, 500);
      }

      return c.json({message: "Order marked as paid", order: data});
    } else {
      return c.json({error: "Order cannot be marked as paid"}, 400);
    }
  } else {
    const canMarkPaid = canMarkPaidUndelivered(order);

    if (canMarkPaid) {
      const {data, error} = await supabase.from("orders")
        .update({
          status: "paid",
          payment_method,
          payment_data,
          paid_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .select("*")
        .single();

      if (error) {
        console.error("Failed to update order status", error);
        return c.json({error: "Failed to update order status"}, 500);
      }

      return c.json({message: "Order marked as paid", order: data});
    } else {
      return c.json({error: "Order cannot be marked as paid"}, 400);
    }
  }
});

ordersRoutes.post('/:id/mark_delivered', async (c) => {
  const supabase = c.get("supabaseClient");

  if (!supabase) {
    return c.json({error: "Failed to read order"}, 500);
  }

  const {id: orderId} = c.req.param();

  const {data: order, error} = await supabase.from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Failed to read order", error);
    return c.json({error: "Failed to read order"}, 500);
  }

  const canMark = canMarkDelivered(order);

  if (canMark) {
    const {data, error} = await supabase.from("orders")
      .update({
        status: "delivered",
        completed_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("*")
      .single();

    if (error) {
      console.error("Failed to update order status", error);
      return c.json({error: "Failed to update order status"}, 500);
    }

    return c.json({message: "Order marked as delivered", order: data});
  } else {
    return c.json({error: "Order cannot be marked as delivered"}, 400);
  }
});

export default ordersRoutes;