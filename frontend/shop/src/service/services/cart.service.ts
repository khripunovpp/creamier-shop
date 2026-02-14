import {Injectable} from '@angular/core';
import {CartItem} from '../../types/cart.type';
import {Countable} from '../../types/countable';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  constructor() {
  }

  private _cart: CartItem<Countable>[] = [];
  private _cartSubject = new BehaviorSubject<CartItem<Countable>[]>([]);

  get cart() {
    return this._cart;
  }

  get cart$() {
    return this._cartSubject.asObservable();
  }

  addToCart(item: CartItem<Countable>) {
    const existingItem = this._cart
      .find(cartItem => cartItem.item.id === item.item.id);

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this._cart.push(item);
    }
    this._cartSubject.next(this._cart);
  }

  incrementCount(item: Countable) {
    const existingItem = this._cart
      .find(cartItem => cartItem.item.id === item.id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      this.addToCart({
        item,
        quantity: 1,
      });
    }
    this._cartSubject.next(this._cart);
  }

  decrementCount(item: Countable) {
    const existingItem = this._cart
      .find(cartItem => cartItem.item.id === item.id);

    if (existingItem && existingItem.quantity > 1) {
      existingItem.quantity -= 1;
    } else if (existingItem) {
      this.removeFromCart(existingItem);
    }
    this._cartSubject.next(this._cart);
  }

  removeFromCart(item: CartItem<Countable>) {
    const index = this._cart
      .findIndex(cartItem => cartItem.item.id === item.item.id);

    if (index !== -1) {
      this._cart.splice(index, 1);
      this._cartSubject.next(this._cart);
    }
  }

  clearCart() {
    this._cart = [];
    this._cartSubject.next(this._cart);
  }
}
