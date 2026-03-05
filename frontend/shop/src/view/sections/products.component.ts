import {Component, inject} from '@angular/core';
import {ProductsService} from '../../service/services/products.service';
import {AsyncPipe} from '@angular/common';
import {ProductItemComponent} from '../products/product-item.component';
import {CartService} from '../../service/services/cart.service';
import {Product} from '../../types/product.type';
import {combineLatestWith, map, Observable, shareReplay} from 'rxjs';
import {CartItem} from '../../types/cart.type';
import {ContainerComponent} from '../layout/container.component';
import {TabsComponent} from '../../shared/ui/tabs/tabs.component';
import {TabDirective} from '../../shared/ui/tabs/tab.directive';

@Component({
  selector: 'cmh-products',
  template: `
    @defer {
      <section class="products">
        <cmh-container>
          <cmh-tabs>
            @for (cat of (categories$ | async); track cat) {
              <ng-template [alias]="cat"
                           [label]="cat"
                           cmhTab>
                <div class="products__list">
                  @for (item of (items$ | async); track item.product.id + '-' + (item.cartItem ? item.cartItem.quantity : '0')) {
                    @if (item.product.category_name === cat || cat === 'all') {
                      <cmh-product-item (onAddToCart)="onAddToCartHandler(item.product)"
                                        (onIncrementCount)="onIncrementCountHandler(item.product)"
                                        (onDecrementCount)="onDecrementCountHandler(item.product)"
                                        [cartItem]="item.cartItem"
                                        class="products__item"
                                        [product]="item.product"></cmh-product-item>
                    }
                  }
                </div>
              </ng-template>
            }
          </cmh-tabs>


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
    ContainerComponent,
    TabsComponent,
    TabDirective
  ]
})
export class ProductsComponent {
  constructor() {
  }

  private readonly _productsService = inject(ProductsService);
  readonly products$ = this._productsService.getProducts$.pipe(
    shareReplay(),
  )
  private readonly _cartService = inject(CartService);
  readonly cart$ = this._cartService.cart$;
  readonly categories$ = this.products$.pipe(
    map(products => products.reduce((acc, prod) => {
      acc.add(prod.category_name);
      return acc;
    }, new Set<string>())),
    map((categoriesSet => ['all'].concat(Array.from(categoriesSet)))),
  );
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

  readonly trackByProductId = (index: number, item: {
    product: Product
    cartItem: CartItem<Product> | undefined
  }) => {
    return item.product.id + '-' + (item.cartItem ? item.cartItem.quantity : '0');
  };

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
