import {Order} from './orders.service';

export const canMarkPaidUndelivered = (order: Order) => {
  return [
    'created',
  ].includes(order.status);
}

export const canMarkPaidDelivered = (order: Order) => {
  return [
    'created',
    'delivered',
  ].includes(order.status);
}

export const orderIsDelivered = (order: Order) => {
  return order.status === 'delivered';
}

export const canMarkDelivered = (order: Order) => {
  return [
    'created',
    'paid',
  ].includes(order.status);
}
