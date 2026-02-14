import {Component, signal} from '@angular/core';
import {HeroComponent} from '../view/sections/hero.component';
import {ProductsComponent} from '../view/sections/products.component';
import {HeaderComponent} from '../view/sections/header.component';

@Component({
  selector: 'app-root',
  imports: [
    HeroComponent,
    ProductsComponent,
    HeaderComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('shop');
}
