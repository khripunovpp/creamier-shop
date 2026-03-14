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
    const parameters = {
      items: order.cart.map(item => ({
        id: item.item.id,
        quantity: item.quantity,
      })),
      name: order.delivery.name,
      email: order.delivery.email,
      phone_number: order.delivery.phoneNumber,
      telegram: order.delivery.telegram,
      whatsapp: order.delivery.whatsapp,
      delivery_date: new Date(order.delivery.time).toISOString(),
      delivery_info: order.delivery.shipping,
      delivery_type: order.delivery.shipping ? 'shipping' : 'pickup',
      comment: order.delivery.comment,
    };
    return this._apiService.post(
      environment.worker_url + '/api/orders/create',
      parameters
    );
  }
}
