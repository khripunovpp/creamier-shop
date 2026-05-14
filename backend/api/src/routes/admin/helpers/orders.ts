// Minimal shape — helpers only inspect status to decide transitions.
type OrderLike = {
  status: 'created' | 'paid' | 'delivered' | 'cancelled' | 'returned';
  paid_at?: string | null;
};

export const canMarkPaidUndelivered = (order: OrderLike) => {
  return ['created'].includes(order.status);
};

export const canMarkPaidDelivered = (order: OrderLike) => {
  return ['created', 'delivered'].includes(order.status);
};

export const orderIsDelivered = (order: OrderLike) => {
  return order.status === 'delivered';
};

export const canMarkDelivered = (order: OrderLike) => {
  return ['created', 'paid'].includes(order.status);
};

// Finalized = delivered and paid. No further admin edits allowed.
export const isOrderLocked = (order: OrderLike) => {
  return order.status === 'delivered' && !!order.paid_at;
};
