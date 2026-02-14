import {inject, Injectable} from '@angular/core';
import {CartService} from './cart.service';
import {combineLatestWith, map, Observable} from 'rxjs';
import {Order} from '../../types/order.type';
import {DeliveryService} from './delivery.service';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  constructor() {
  }

  readonly cartService = inject(CartService);
  readonly deliveryService = inject(DeliveryService);

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
}
