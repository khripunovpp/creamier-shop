import {Component} from '@angular/core';
import {HeroComponent} from '../view/sections/hero.component';
import {ProductsComponent} from '../view/sections/products.component';

@Component({
  selector: 'cmh-home',
  template: `
    <cmh-hero></cmh-hero>
    <cmh-products></cmh-products>
  `,
  styles: `
  `,
  imports: [
    HeroComponent,
    ProductsComponent
  ]
})
export class HomeComponent {
  constructor() {
  }
}
