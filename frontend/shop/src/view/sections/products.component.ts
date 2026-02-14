import {Component, inject} from '@angular/core';
import {ProductsService} from '../../service/services/products.service';
import {AsyncPipe} from '@angular/common';
import {ProductItemComponent} from '../products/product-item.component';
import {CartService} from '../../service/services/cart.service';
import {Product} from '../../types/product.type';
import {combineLatestWith, map, Observable} from 'rxjs';
import {CartItem} from '../../types/cart.type';
import {ContainerComponent} from '../layout/container.component';

@Component({
  selector: 'cmh-products',
  template: `
    @defer {
      <section class="products">
        <cmh-container>
          <div class="products__list">
            @for (item of (items$ | async); track item.product) {
              <cmh-product-item (onAddToCart)="onAddToCartHandler(item.product)"
                                (onIncrementCount)="onIncrementCountHandler(item.product)"
                                (onDecrementCount)="onDecrementCountHandler(item.product)"
                                [cartItem]="item.cartItem"
                                class="products__item"
                                [product]="item.product"></cmh-product-item>
            }
          </div>
        </cmh-container>
      </section>
    }
  `,
  styles: `
    .products {
      padding: 50px 0;

      &__list {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
      }

      &__item {
        flex: 0 0 calc(25% - calc(20px * 3 / 4));
      }
    }
  `,
  imports: [
    AsyncPipe,
    ProductItemComponent,
    ContainerComponent
  ]
})
export class ProductsComponent {
  constructor() {
  }

  private readonly _productsService = inject(ProductsService);
  private readonly _cartService = inject(CartService);
  readonly products$ = this._productsService.getProducts();
  readonly cart$ = this._cartService.cart$;

  readonly items$: Observable<{
    product: Product
    cartItem: CartItem<Product> | undefined
  }[]> = this.cart$.pipe(
    combineLatestWith(this.products$),
    map(([cart, products]) => {
      return products.map(product => {
        const cartItem = cart.find(item => item.item.id === product.id) as CartItem<Product> | undefined;
        return {
          product,
          cartItem,
        };
      });
    }),
  );

  onAddToCartHandler(product: Product) {
    this._cartService.addToCart({
      item: product,
      quantity: 1,
    });
  }

  onIncrementCountHandler(product: Product) {
    this._cartService.incrementCount(product);
  }

  onDecrementCountHandler(product: Product) {
    this._cartService.decrementCount(product);
  }
}
