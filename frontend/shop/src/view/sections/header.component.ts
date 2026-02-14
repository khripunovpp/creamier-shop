import {Component} from '@angular/core';
import {ContainerComponent} from '../layout/container.component';
import {CartWidgetComponent} from '../cart/cart-widget.component';

@Component({
  selector: 'cmh-header',
  template: `
    <header class="header">
      <cmh-container>
        <div class="header__list">
          <cmh-cart-widget></cmh-cart-widget>
        </div>
      </cmh-container>
    </header>
  `,
  styles: `
    .header {
      padding: 16px 0;

      &__list {
        display: flex;
        justify-content: flex-end;
      }
    }
  `,
  imports: [
    ContainerComponent,
    CartWidgetComponent
  ]
})
export class HeaderComponent {
  constructor() {
  }
}
