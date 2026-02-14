import {Component, input} from '@angular/core';
import {Product} from '../../types/product.type';
import {CartItem} from '../../types/cart.type';

@Component({
  selector: 'cmh-product-item',
  template: `
    @if (product(); as product) {
      <div class="product-item">
        {{ product.name }} = {{ product.price }}$
      </div>

      <button type="button"></button>
    }
  `,
  styles: ``,
})
export class ProductItemComponent {
  constructor() {
  }

  readonly product = input.required<Product>();
  readonly cartItem = input.required<CartItem<Product>>();

  addToCartHandler() {
  }

  decrementCountHandler() {
  }

  incrementCountHandler() {
  }
}
