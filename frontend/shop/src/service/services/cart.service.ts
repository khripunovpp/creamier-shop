import {inject, Injectable} from '@angular/core';
import {CartItem} from '../../types/cart.type';
import {Countable} from '../../types/countable';
import {BehaviorSubject, map, take} from 'rxjs';
import {ProductsService} from './products.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  constructor() {
    this.initializeCart();
  }

  private _cartSubject = new BehaviorSubject<CartItem<Countable>[]>([]);
  private _products$ = inject(ProductsService).getProducts$;

  get sum$() {
    return this.cart$.pipe(
      map(cart => cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0)),
    );
  }

  get count$() {
    return this.cart$.pipe(
      map(cart => cart.length),
    )
  };

  private _cart: CartItem<Countable>[] = [];

  get cart() {
    return this._cart;
  }

  get cart$() {
    return this._cartSubject.asObservable();
  }

  initializeCart() {
    this._parseCart()
      .subscribe(cart => {
        this._cart = cart;
        this._cartSubject.next(this._cart);
      });
  }

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
        itemId: cartItem.item.id,
        quantity: cartItem.quantity,
      })));
      localStorage.setItem('cart', cartData);
    } catch (e) {
      console.error('Failed to store cart in localStorage', e);
    }
  }

  private _parseCart() {
    return this._products$.pipe(
      map(products => {
        try {
          const cartData = localStorage.getItem('cart');
          if (!cartData) return [];

          const parsed = JSON.parse(cartData);

          if (Array.isArray(parsed)) {
            return parsed.map(cartItem => {
              const product = products.find(p => p.id === cartItem.itemId);
              if (product) {
                return {
                  item: product,
                  quantity: cartItem.quantity,
                } as CartItem<Countable>;
              }
              return null;
            }).filter((item): item is CartItem<Countable> => item !== null);
          }
          return [];
        } catch (e) {
          console.error('Failed to parse cart data', e);
          return [];
        }
      }),
      take(1),
    );
  }
}
