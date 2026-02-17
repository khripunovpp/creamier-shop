import {Component} from '@angular/core';
import {CardComponent} from '../shared/ui/card/card.component';
import {FlexRowComponent} from '../shared/ui/layout/flex-row.component';
import {RouterLink} from '@angular/router';
import {WidthDirective} from '../shared/directives/width.directive';
import {TitleComponent} from '../shared/ui/layout/title.component';
import {FlexColumnComponent} from '../shared/ui/layout/flex-column.component';

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
            <cm-flex-column size="small">
              <div class="dashboard-menu__item-icon">
                <img src="/icons/stock-icon.svg"
                     alt="stock icon">
              </div>

              <div class="dashboard-menu__item-caption">
                Stock
              </div>
            </cm-flex-column>
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
    TitleComponent,
    FlexColumnComponent
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
        font-size: 35px;
        line-height: 40px;
        --dashboard-menu-item-opacity: 0.6;

        &-caption {
          font-size: 0.8em;
          opacity: var(--dashboard-menu-item-opacity);
        }

        &-icon {
          width: 48px;
          height: 48px;
          margin-left: auto;

          img {
            width: 100%;
            height: 100%;
          }
        }

        &:hover {
          --dashboard-menu-item-opacity: 1;
        }
      }
    }
  `
})
export class DashboardComponent {
  constructor() {
  }
}
