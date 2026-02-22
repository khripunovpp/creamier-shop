import {Component, inject, resource} from '@angular/core';
import {StockService} from '../stock.service';
import {TableCardComponent} from '../../shared/ui/card/table-card.component';
import {InlineCircleLoaderComponent} from '../../shared/ui/inline-circle-loader.component';
import {FlexRowComponent} from '../../shared/ui/layout/flex-row.component';
import {TitleComponent} from '../../shared/ui/layout/title.component';
import {FlexColumnComponent} from '../../shared/ui/layout/flex-column.component';
import {ButtonComponent} from '../../shared/ui/controls/button/button.component';
import {PullDirective} from '../../shared/directives/pull.directive';
import {HomeLinkComponent} from '../../shared/ui/home-link.component';
import {firstValueFrom} from 'rxjs';
import {ContainerComponent} from '../../shared/ui/layout/container.component';

@Component({
  selector: 'cm-stock-items',
  host: {
    class: 'cm-host-expanded'
  },
  template: `
    <cm-container>
      <cm-flex-column>
        <cm-flex-row size="small" [center]="true">
          <cm-home-link></cm-home-link>

          <cm-title>Stock Items</cm-title>

          @if (stock.isLoading()) {
            <cm-inline-circle-loader></cm-inline-circle-loader>
          }

          <cm-button cmPull
                     link="/stock/create"
                     size="tiny">Create
          </cm-button>
        </cm-flex-row>

        @if (stock.hasValue()) {
          <cm-table-card [size]="'medium'">
            <table>
              <colgroup>
                <col span="1" style="width: 30%;">
                <col span="1" style="width: 20%;">
                <col span="1" style="width: 20%;">
                <col span="1" style="width: 20%;">
                <col span="1" style="width: 10%;">
              </colgroup>
              <tbody>
                @for (item of stock.value(); track item) {
                  <tr>
                    <td>{{ item.name }}</td>
                    <td>
                      {{ item.price }}
                    </td>
                    <td>{{ item.cost_price }}</td>
                    <td>{{ item.price - item.cost_price }}</td>
                    <td>{{ item.status }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </cm-table-card>
        }
      </cm-flex-column>
    </cm-container>
  `,
  imports: [
    TableCardComponent,
    InlineCircleLoaderComponent,
    FlexRowComponent,
    TitleComponent,
    FlexColumnComponent,
    ButtonComponent,
    PullDirective,
    HomeLinkComponent,
    ContainerComponent
  ],
  styles: `
  `
})
export class StockItemsComponent {
  constructor() {
  }

  private readonly _stockService = inject(StockService);

  readonly stock = resource({
    loader: ({params, abortSignal}) => {
      return firstValueFrom(this._stockService.getProducts());
    },
  });
}
