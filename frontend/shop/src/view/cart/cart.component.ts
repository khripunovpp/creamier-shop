import {Component, inject} from '@angular/core';
import {CartService} from '../../service/services/cart.service';

@Component({
  selector: 'cmh-cart',
  template: `
    <section class="cart">
      Cart
    </section>
  `,
  styles: `
  `,
})
export class CartComponent {
  constructor() {
  }

  readonly cart = inject(CartService);
}
