import {Component, inject} from '@angular/core';
import {ContainerComponent} from '../layout/container.component';
import {CartWidgetComponent} from '../cart/cart-widget.component';
import {IS_HOME} from '../../service/providers/is_home_page.provider';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'cmh-header',
  template: `
    <header class="header">
      <cmh-container>
        <div class="header__list">
          @if (!isHome()) {
            <a routerLink="/">Home</a>
          }
          <cmh-cart-widget class="header__cart"></cmh-cart-widget>
        </div>
      </cmh-container>
    </header>
  `,
  styles: `
    .header {
      padding: 16px 0;

      &__list {
        display: flex;
      }

      &__cart {
        margin-left: auto;
      }
    }
  `,
  imports: [
    ContainerComponent,
    CartWidgetComponent,
    RouterLink
  ]
})
export class HeaderComponent {
  constructor() {
  }

  readonly isHome = inject(IS_HOME);
}
