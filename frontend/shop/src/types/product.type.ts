import {Countable} from './countable';

export interface Product extends Countable {
  id: number
  name: string
  price: number
  availableQuantity: number
}
