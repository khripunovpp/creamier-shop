import {Countable} from './countable';

export interface CartItem<Item extends Countable> {
  item: Item
  quantity: number
}
