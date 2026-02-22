import {inject, Injectable} from '@angular/core';
import {CartService} from './cart.service';
import {combineLatestWith, map, Observable} from 'rxjs';
import {Order} from '../../types/order.type';
import {DeliveryService} from './delivery.service';
import {ApiService} from './api.service';
import {environment} from '../../env/environment';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  constructor() {
  }

  readonly cartService = inject(CartService);
  readonly deliveryService = inject(DeliveryService);
  private readonly _apiService = inject(ApiService);

  get order$(): Observable<Order> {
    return this.cartService.cart$.pipe(
      combineLatestWith(this.deliveryService.deliveryDetails$),
      map(([cart, deliveryDetails]) => ({
        cart: cart,
        delivery: deliveryDetails,
      })),
    );
  }

  get total$() {
    return this.cartService.sum$;
  }

  createOrder(
    order: Order
  ) {
    return this._apiService.post(
      environment.worker_url + '/api/public/orders/create',
      {
        items: order.cart.map(item => ({
          id: item.item.id,
          quantity: item.quantity,
        })),
        name: 'Mr. John Doe',
        email: 'supersecretemail@not.com',
      }
    );
  }
}
