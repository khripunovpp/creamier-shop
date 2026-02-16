import {Component} from '@angular/core';
import {CardComponent} from '../shared/ui/card/card.component';
import {FlexRowComponent} from '../shared/ui/layout/flex-row.component';
import {RouterLink} from '@angular/router';
import {WidthDirective} from '../shared/directives/width.directive';
import {TitleComponent} from '../shared/ui/layout/title.component';

@Component({
  selector: 'cm-dashboard',
  template: `
    <cm-title>Hey there, welcome back!</cm-title>

    <section class="dashboard-menu">
      <cm-flex-row>
        <a routerLink="/stock"
           cmWidth="25%"
           class="dashboard-menu__item">
          <cm-card>
          <span class="dashboard-menu__item-caption">
            Stock
          </span>
            <div class="dashboard-menu__item-icon">
              <img src="/icons/stock-icon.svg" alt="stock icon">
            </div>
          </cm-card>
        </a>
      </cm-flex-row>
    </section>
  `,
  imports: [
    CardComponent,
    FlexRowComponent,
    RouterLink,
    WidthDirective,
    TitleComponent
  ],
  styles: `
    :host {
      display: block;
    }

    .dashboard-menu {
      margin-top: 24px;

      &__item {
        flex: 1 1 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        color: inherit;
        text-decoration: none;
        font-size: 25px;

        &-caption {
          font-size: 0.8em;
          opacity: 0.6;
          margin-bottom: 12px;
        }

        &-icon {
          width: 48px;
          height: 48px;

          img {
            width: 100%;
            height: 100%;
          }
        }
      }
    }
  `
})
export class DashboardComponent {
  constructor() {
  }
}
