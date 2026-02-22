import {Component, inject} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {OrderService} from '../../service/services/order.service';

@Component({
  selector: 'cmh-order-content',
  template: `
    @if (orderService.order$|async; as order) {
      <section class="order-content">
        @for (item of order?.cart; track item.item) {
          <div class="order-content__item">
            {{ item.item.id }}: {{ item.item.price }} x {{ item.quantity }} = {{ item.item.price * item.quantity }} $
          </div>
        }

        <hr>

        Total: {{ orderService.total$|async }} $

        <button type="button" (click)="onPlaceOrder(order)">Place</button>
      </section>
    }
  `,
  styles: `
  `,
  imports: [
    AsyncPipe
  ]
})
export class OrderContentComponent {
  constructor() {
  }

  readonly orderService = inject(OrderService);

  onPlaceOrder(
    order: any
  ) {
    this.orderService.createOrder(order).subscribe({
      next: (response) => {
        console.log('Order created successfully:', response);
      },
      error: (error) => {
        console.error('Error creating order:', error);
      }
    });
  }
}
