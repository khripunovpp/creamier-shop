import {Component, inject} from '@angular/core';
import {CartService} from '../../service/services/cart.service';
import {AsyncPipe} from '@angular/common';
import {OrderService} from '../../service/services/order.service';

@Component({
  selector: 'cmh-order-content',
  template: `
    <section class="order-content">
      @for (item of (orderService.order$|async)?.cart; track item.item) {
        <div class="order-content__item">
          {{ item.item.id }}: {{ item.item.price }} x {{ item.quantity }} = {{ item.item.price * item.quantity }} $
        </div>
      }

      <hr>

      Total: {{ orderService.total$|async }} $
    </section>
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
}
