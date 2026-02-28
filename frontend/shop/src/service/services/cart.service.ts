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

  addToCart(cartItem: CartItem<Countable>) {
    const existingItem = this._cart
      .find(ci => ci.item.id === cartItem.item.id);

    if (!cartItem.item.available_quantity) return;

    if (existingItem && (existingItem.quantity + cartItem.quantity) <= cartItem.item.available_quantity) {
      this._cart = this._cart.map(ci =>
        ci.item.id === cartItem.item.id ? {...ci, quantity: ci.quantity + cartItem.quantity} : ci
      );
    } else if (existingItem) {
      this._cart = this._cart.map(ci =>
        ci.item.id === cartItem.item.id ? {...ci, quantity: cartItem.item.available_quantity} : ci
      );
    } else {
      this._cart = [...this._cart, cartItem];
    }
    this._emitCart();
  }

  incrementCount(item: Countable) {
    const existingItem = this._cart
      .find(ci => ci.item.id === item.id);

    if (!item.available_quantity) return;

    if (existingItem && existingItem.quantity < item.available_quantity) {
      this._cart = this._cart.map(ci =>
        ci.item.id === item.id ? {...ci, quantity: ci.quantity + 1} : ci
      );
      this._emitCart();
    } else if (!existingItem) {
      this.addToCart({
        item,
        quantity: 1,
      });
    }
  }

  decrementCount(item: Countable) {
    const existingItem = this._cart
      .find(ci => ci.item.id === item.id);

    if (!existingItem) return;

    if (existingItem.quantity > item.available_quantity) {
      this._cart = this._cart.map(ci =>
        ci.item.id === item.id ? {...ci, quantity: item.available_quantity} : ci
      );
      this._emitCart();
    } else if (existingItem.quantity > 1) {
      this._cart = this._cart.map(ci =>
        ci.item.id === item.id ? {...ci, quantity: ci.quantity - 1} : ci
      );
    } else {
      this.removeFromCart(existingItem);
    }
    this._emitCart();
  }

  removeFromCart(item: CartItem<Countable>) {
    const index = this._cart
      .findIndex(ci => ci.item.id === item.item.id);

    if (index !== -1) {
      this._cart = this._cart.filter((_, i) => i !== index);
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
              if (product?.available_quantity) {
                const enoughStock = product.available_quantity >= cartItem.quantity;
                return {
                  item: product,
                  quantity: enoughStock ? cartItem.quantity : product.available_quantity,
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
