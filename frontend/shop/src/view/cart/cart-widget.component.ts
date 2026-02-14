import {Component, inject} from '@angular/core';
import {CartService} from '../../service/services/cart.service';
import {AsyncPipe} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'cmh-cart-widget',
  template: `
    <section class="cart-widget">
      <a routerLink="/order">
        {{ cart.sum$|async }} $
      </a>
    </section>
  `,
  styles: `
  `,
  imports: [
    AsyncPipe,
    RouterLink
  ]
})
export class CartWidgetComponent {
  constructor() {
  }

  readonly cart = inject(CartService);
}
