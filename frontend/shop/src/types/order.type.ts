import {CartItem} from './cart.type';
import {Countable} from './countable';

export interface DeliveryDetails {
  shipping: ShippingDetails
  time: number
  phoneNumber: string
  name: string
}

export interface ShippingDetails {
  postalCode: string
  addressLine1: string
  addressLine2?: string
}

export interface Order {
  cart: CartItem<Countable>[]
  delivery?: DeliveryDetails
}
