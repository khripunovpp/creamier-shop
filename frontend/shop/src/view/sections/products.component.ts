import {Component, inject} from '@angular/core';
import {ProductsService} from '../../service/services/products.service';
import {AsyncPipe} from '@angular/common';
import {ProductItemComponent} from '../products/product-item.component';

@Component({
  selector: 'cmh-products',
  template: `
    <h2>Products</h2>
    @defer {
      @for (product of (products$ | async); track product) {
        <cmh-product-item [product]="product"></cmh-product-item>
      }
    }
  `,
  styles: ``,
  imports: [
    AsyncPipe,
    ProductItemComponent
  ]
})
export class ProductsComponent {
  constructor() {
  }

  private readonly _productsService = inject(ProductsService);
  readonly products$ = this._productsService.getProducts();
}
