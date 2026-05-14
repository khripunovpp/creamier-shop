import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../view/sections/header.component';
import { CartDrawerComponent } from '../view/cart/cart-drawer.component';
import { CartFabComponent } from '../view/cart/cart-fab.component';
import { OrderComponent } from '../view/order/order.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent,
    RouterOutlet,
    CartDrawerComponent,
    CartFabComponent,
    OrderComponent,
  ],
  template: `
    <main class="page-wrapper">
      <cmh-header></cmh-header>
      <router-outlet></router-outlet>
    </main>
    @defer {
      <cmh-cart-drawer/>
      <cmh-cart-fab/>
      <cmh-order/>
    }
  `,
  styles: `
    .page-wrapper { display: flex; flex-direction: column; }
  `,
})
export class App {}
