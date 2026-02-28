import {OrderScheme} from "../../../schemes/order.scheme";

export const canMarkPaidUndelivered = (order: OrderScheme) => {
  return [
    'created',
  ].includes(order.status);
}

export const canMarkPaidDelivered = (order: OrderScheme) => {
  return [
    'created',
    'delivered',
  ].includes(order.status);
}

export const orderIsDelivered = (order: OrderScheme) => {
  return order.status === 'delivered';
}

export const canMarkDelivered = (order: OrderScheme) => {
  return [
    'created',
    'paid',
  ].includes(order.status);
}