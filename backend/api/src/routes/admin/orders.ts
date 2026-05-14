import {Hono} from "hono";
import {zValidator} from '@hono/zod-validator';
import {Bindings, Variables} from "../../index";
import {canMarkDelivered, canMarkPaidDelivered, canMarkPaidUndelivered, isOrderLocked, orderIsDelivered} from "./helpers/orders";
import {
  adminAddOrderItemScheme,
  adminCreateOrderScheme,
  adminUpdateOrderItemScheme,
  adminUpdateOrderScheme,
} from "../../schemes/order.scheme";

const ordersRoutes = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

ordersRoutes.post('/', zValidator('json', adminCreateOrderScheme), async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to create order"}, 500);

  const body = c.req.valid('json');
  const adminId = c.get("user")?.id;

  // delivery_time piggy-backs on delivery_info JSONB, same convention as
  // public api-public's /orders/create.
  const enrichedDeliveryInfo = {
    ...(body.delivery_info ?? {}),
    ...(body.delivery_time ? {time: body.delivery_time} : {}),
  };

  const {data, error} = await supabase.rpc('admin_create_order', {
    p_name: body.name,
    p_email: body.email ?? null,
    p_phone_number: body.phone_number ?? null,
    p_telegram: body.telegram ?? null,
    p_whatsapp: body.whatsapp ?? null,
    p_items: body.items,
    p_delivery_date: body.delivery_date ?? null,
    p_delivery_info: enrichedDeliveryInfo,
    p_delivery_type: body.delivery_type,
    p_comment: body.comment ?? null,
    p_status: body.status,
    p_discount_amount: body.discount_amount,
    p_payment_method: body.payment_method ?? null,
    p_paid_at: body.paid_at ?? null,
  });

  if (error) {
    console.error("Admin order creation failed", error);
    if ((error as any).code === 'P0001') {
      return c.json({error: error.message}, 400);
    }
    return c.json({error: "Failed to create order"}, 500);
  }

  console.log("Admin order created", {id: data, adminId});
  return c.json({id: data}, 201);
});

ordersRoutes.put('/:id', zValidator('json', adminUpdateOrderScheme), async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to update order"}, 500);

  const {id: orderId} = c.req.param();
  const body = c.req.valid('json');

  const {data: order, error: fetchErr} = await supabase.from("orders")
    .select("user_id, status, paid_at").eq("id", orderId).single();
  if (fetchErr || !order) return c.json({error: "Order not found"}, 404);
  if (isOrderLocked(order)) {
    return c.json({error: "Order is finalized and cannot be modified"}, 409);
  }

  // Customer is normalized — patching it affects ALL orders for this customer.
  // Admin uses this for typo fixes; cleaner option would be a separate endpoint.
  if (body.customer && order.user_id) {
    const {error: custErr} = await supabase.from("customers")
      .update(body.customer).eq('id', order.user_id);
    if (custErr) {
      console.error("Failed to update customer", custErr);
      return c.json({error: "Failed to update customer"}, 500);
    }
  }

  const {customer, delivery_time, delivery_info, ...rest} = body;

  // delivery_time piggy-backs on delivery_info JSONB. Merge with existing when
  // only delivery_time is provided so other fields (address, contact_channel) survive.
  let mergedDeliveryInfo: Record<string, unknown> | undefined;
  if (delivery_time !== undefined || delivery_info !== undefined) {
    if (delivery_info === undefined && delivery_time !== undefined) {
      const {data: cur} = await supabase.from("orders")
        .select("delivery_info").eq("id", orderId).single();
      mergedDeliveryInfo = {
        ...((cur?.delivery_info as Record<string, unknown>) ?? {}),
        time: delivery_time,
      };
    } else {
      mergedDeliveryInfo = {
        ...(delivery_info ?? {}),
        ...(delivery_time !== undefined ? {time: delivery_time} : {}),
      };
    }
  }

  const patch: Record<string, unknown> = {...rest};
  if (mergedDeliveryInfo !== undefined) patch.delivery_info = mergedDeliveryInfo;

  if (Object.keys(patch).length > 0) {
    const {error} = await supabase.from("orders").update(patch).eq('id', orderId);
    if (error) {
      console.error("Failed to update order", error);
      return c.json({error: "Failed to update order"}, 500);
    }
  }

  console.log("Order updated", {orderId, adminId: c.get("user")?.id});
  return c.json({message: "Order updated"});
});

ordersRoutes.post('/:id/items', zValidator('json', adminAddOrderItemScheme), async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to add item"}, 500);
  const {id: orderId} = c.req.param();
  const body = c.req.valid('json');

  const {data: order, error: fetchErr} = await supabase.from("orders")
    .select("status, paid_at").eq("id", orderId).single();
  if (fetchErr || !order) return c.json({error: "Order not found"}, 404);
  if (isOrderLocked(order)) {
    return c.json({error: "Order is finalized and cannot be modified"}, 409);
  }

  const {data, error} = await supabase.rpc('admin_add_order_item', {
    p_order_id: orderId,
    p_stock_set_rule_id: body.stock_set_rule_id,
    p_flavor_ids: body.flavor_ids,
    p_quantity: body.quantity,
  });
  if (error) {
    console.error("Failed to add order item", error);
    if ((error as any).code === 'P0001') return c.json({error: error.message}, 400);
    return c.json({error: "Failed to add item"}, 500);
  }
  return c.json({id: data}, 201);
});

ordersRoutes.put('/:id/items/:item_id', zValidator('json', adminUpdateOrderItemScheme), async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to update item"}, 500);
  const {id: orderId, item_id} = c.req.param();
  const body = c.req.valid('json');

  const {data: order, error: fetchErr} = await supabase.from("orders")
    .select("status, paid_at").eq("id", orderId).single();
  if (fetchErr || !order) return c.json({error: "Order not found"}, 404);
  if (isOrderLocked(order)) {
    return c.json({error: "Order is finalized and cannot be modified"}, 409);
  }

  const {error} = await supabase.rpc('admin_update_order_item', {
    p_order_item_id: item_id,
    p_quantity: body.quantity,
  });
  if (error) {
    console.error("Failed to update order item", error);
    if ((error as any).code === 'P0001') return c.json({error: error.message}, 400);
    return c.json({error: "Failed to update item"}, 500);
  }
  return c.json({message: "Item updated"});
});

ordersRoutes.delete('/:id/items/:item_id', async (c) => {
  const supabase = c.get("supabaseClient");
  if (!supabase) return c.json({error: "Failed to delete item"}, 500);
  const {id: orderId, item_id} = c.req.param();

  const {data: order, error: fetchErr} = await supabase.from("orders")
    .select("status, paid_at").eq("id", orderId).single();
  if (fetchErr || !order) return c.json({error: "Order not found"}, 404);
  if (isOrderLocked(order)) {
    return c.json({error: "Order is finalized and cannot be modified"}, 409);
  }

  const {error} = await supabase.rpc('admin_delete_order_item', {
    p_order_item_id: item_id,
  });
  if (error) {
    console.error("Failed to delete order item", error);
    if ((error as any).code === 'P0001') return c.json({error: error.message}, 400);
    return c.json({error: "Failed to delete item"}, 500);
  }
  return c.json({message: "Item deleted"});
});

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
      items:order_items (
        id,
        stock_item_id,
        set_slug,
        set_count,
        quantity,
        price,
        cost_price,
        flavors:order_item_flavors (
          position,
          stock_item:stock_items (id, name, name_pt)
        )
      ),
      customer:customers (name, email, phone_number, telegram, whatsapp)
    `)
    .eq("id", id)
    .single();


  if (error) {
    console.error("Failed to fetch order", error);
    return c.json({error: "Failed to fetch order"}, 500);
  }

  return c.json(data);
});

ordersRoutes.post('/:id/mark_paid', async (c) => {
  const supabase = c.get("supabaseClient");

  if (!supabase) {
    return c.json({error: "Failed to read order"}, 500);
  }

  const {id: orderId} = c.req.param();
  const adminId = c.get("user")?.id;

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

      console.log("Order marked as paid", {orderId, adminId});
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

      console.log("Order marked as paid", {orderId, adminId});
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
  const adminId = c.get("user")?.id;

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

    console.log("Order marked as delivered", {orderId, adminId});
    return c.json({message: "Order marked as delivered", order: data});
  } else {
    return c.json({error: "Order cannot be marked as delivered"}, 400);
  }
});

export default ordersRoutes;