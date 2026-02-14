import {Component, inject} from '@angular/core';
import {CartService} from '../../service/services/cart.service';

@Component({
  selector: 'cmh-order-delivery',
  template: `
    <section class="order-delivery">
    </section>
  `,
  styles: `
  `,
})
export class OrderDeliveryComponent {
  constructor() {
  }

  readonly cart = inject(CartService);
}
