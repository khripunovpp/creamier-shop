import {Component, input, output} from '@angular/core';
import {Product} from '../../types/product.type';
import {CartItem} from '../../types/cart.type';

@Component({
  selector: 'cmh-product-item',
  template: `
    @if (product(); as product) {
      <div class="product-item">
        {{ product.name }} = {{ product.price }}$
      </div>

      @if (cartItem()) {
        <div class="product-item__counter">
          <button type="button" (click)="onDecrementCount.emit()">-</button>
          {{ cartItem()!.quantity }}
          <button type="button" (click)="onIncrementCount.emit()">+</button>
        </div>
      } @else {
        <button type="button" (click)="onAddToCart.emit()"></button>
      }
    }
  `,
  styles: ``,
})
export class ProductItemComponent {
  constructor() {
  }

  readonly product = input.required<Product>();
  readonly cartItem = input<CartItem<Product>>();
  readonly onAddToCart = output();
  readonly onIncrementCount = output();
  readonly onDecrementCount = output();

  addToCartHandler() {
    this.onAddToCart.emit();
  }

  decrementCountHandler() {
    this.onDecrementCount.emit();
  }

  incrementCountHandler() {
  }
}
