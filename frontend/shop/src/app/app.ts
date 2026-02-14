import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HeroComponent} from '../view/sections/hero.component';
import {ProductsComponent} from '../view/sections/products.component';
import {ContainerComponent} from '../view/layout/container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeroComponent, ProductsComponent, ContainerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('shop');
}
