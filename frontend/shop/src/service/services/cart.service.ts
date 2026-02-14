import {Injectable} from '@angular/core';
import {CartItem} from '../../types/cart.type';
import {Countable} from '../../types/countable';
import {BehaviorSubject, map} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  constructor() {
    this.initializeCart();
  }

  private _cart: CartItem<Countable>[] = [];
  private _cartSubject = new BehaviorSubject<CartItem<Countable>[]>([]);

  get cart() {
    return this._cart;
  }

  get cart$() {
    return this._cartSubject.asObservable();
  }

  initializeCart() {
    this._loadCart();
  }

  count$ = this.cart$.pipe(
    map(cart => cart.length),
  );
  sum$ = this.cart$.pipe(
    map(cart => cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0)),
  );

  addToCart(item: CartItem<Countable>) {
    const existingItem = this._cart
      .find(cartItem => cartItem.item.id === item.item.id);

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      this._cart.push(item);
    }
    this._emitCart();
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
    this._emitCart();
  }

  decrementCount(item: Countable) {
    const existingItem = this._cart
      .find(cartItem => cartItem.item.id === item.id);

    if (existingItem && existingItem.quantity > 1) {
      existingItem.quantity -= 1;
    } else if (existingItem) {
      this.removeFromCart(existingItem);
    }
    this._emitCart();
  }

  removeFromCart(item: CartItem<Countable>) {
    const index = this._cart
      .findIndex(cartItem => cartItem.item.id === item.item.id);

    if (index !== -1) {
      this._cart.splice(index, 1);
      this._emitCart();
    }
  }

  clearCart() {
    this._cart = [];
    this._emitCart();
  }

  private _emitCart() {
    this._cartSubject.next(this._cart);
    this._storeCart();
  }

  private _storeCart() {
    try {
      const cartData = JSON.stringify(this._cart.map(cartItem => ({
        item: {
          id: cartItem.item.id,
          price: cartItem.item.price,
        },
        quantity: cartItem.quantity,
      })));
      localStorage.setItem('cart', cartData);
    } catch (e) {
      console.error('Failed to store cart in localStorage', e);
    }
  }

  private _loadCart() {
    try {
      const cartData = localStorage.getItem('cart');
      if (cartData) {
        this._cart = this._parseCart(cartData);
        this._cartSubject.next(this._cart);
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
    }
  }

  private _parseCart(cartData: string): CartItem<Countable>[] {
    try {
      const parsed = JSON.parse(cartData) as CartItem<Countable>[];

      if (Array.isArray(parsed)) {
        return parsed.map(item => ({
          item: {
            id: item.item.id,
            price: item.item.price,
          },
          quantity: item.quantity,
        }));
      }
      return [];
    } catch (e) {
      console.error('Failed to parse cart data', e);
      return [];
    }
  }
}
