import {CartItem} from './cart.type';
import {Countable} from './countable';

export interface DeliveryDetails {
  shipping: ShippingDetails | undefined
  time: number
  phoneNumber: string
  email: string
  telegram: string
  whatsapp: string
  name: string
  comment: string
}

export interface ShippingDetails {
  postalCode: string
  addressLine1: string
  addressLine2: string
}

export interface Order {
  cart: CartItem<Countable>[]
  delivery: DeliveryDetails
}
