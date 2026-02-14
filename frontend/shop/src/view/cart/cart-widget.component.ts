import {Component, inject} from '@angular/core';
import {CartService} from '../../service/services/cart.service';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'cmh-cart-widget',
  template: `
    <section class="cart-widget">
      {{ cart.sum$|async }} $
    </section>
  `,
  styles: `
  `,
  imports: [
    AsyncPipe
  ]
})
export class CartWidgetComponent {
  constructor() {
  }

  readonly cart = inject(CartService);
}
