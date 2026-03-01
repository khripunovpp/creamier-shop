import {Countable} from './countable';

export interface Product
  extends Countable {
  id: number
  name: string
  price: number
  status: 'active'
  description: string
  available_quantity: number
  badge: 'sale' | 'hot' | null
}
