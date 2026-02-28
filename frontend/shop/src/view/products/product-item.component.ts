import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {Product} from '../../types/product.type';
import {CartItem} from '../../types/cart.type';

@Component({
  selector: 'cmh-product-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (product(); as product) {
      <div class="product-item">
        <div class="product-item__name"> {{ product.name }}</div>
        <div class="product-item__price"> {{ product.price }}$</div>
        <div class="product-item__actions">

          @if (cartItem()) {
            <div class="product-item__counter">
              <button type="button"
                      [disabled]="!canDecrement()"
                      class="product-item__counter-btn"
                      (click)="onDecrementCount.emit()">-
              </button>
              {{ cartItem()!.quantity }}
              <button type="button"
                      [disabled]="!canIncrement()"
                      class="product-item__counter-btn"
                      (click)="onIncrementCount.emit()">+
              </button>
            </div>
          } @else if (product.available_quantity > 0) {
            <button type="button"
                    class="product-item__add-btn"
                    (click)="onAddToCart.emit()">
              Add to Cart
            </button>
          } @else {
            <div>Out of Stock</div>
          }
        </div>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      border: 1px solid #ccc;
      padding: 20px;
      text-align: center;
    }

    .product-item {
      &__name {
        font-size: 18px;
        font-weight: bold;
      }

      &__price {
        margin: 10px 0;
        font-size: 16px;
        color: #888;
      }

      &__actions {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
      }

      &__add-btn {
        background-color: #007bff;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 16px;
        line-height: 24px;
        padding: 0 8px;
      }

      &__counter {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      &__counter-btn {
        background-color: #007bff;
        color: white;
        border: none;
        cursor: pointer;
        font-size: 16px;
        line-height: 24px;
        padding: 0 8px;
        width: 32px;
      }
    }
  `,
})
export class ProductItemComponent {
  constructor() {
  }

  readonly product = input.required<Product>();
  readonly cartItem = input<CartItem<Product>>();
  readonly onAddToCart = output();
  readonly onIncrementCount = output();
  readonly onDecrementCount = output();
  readonly canIncrement = computed(() => {
    if (!this.cartItem() || !this.product()) return false;
    return this.cartItem()!.quantity + 1 <= this.product()!.available_quantity;
  });
  readonly canDecrement = computed(() => {
    if (!this.cartItem()) return false;
    return this.cartItem()!.quantity > 0;
  });
}
