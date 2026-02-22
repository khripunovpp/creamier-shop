import {ChangeDetectionStrategy, Component, inject, resource} from '@angular/core';
import {OrdersService} from '../orders.service';
import {TableCardComponent} from '../../shared/ui/card/table-card.component';
import {InlineCircleLoaderComponent} from '../../shared/ui/inline-circle-loader.component';
import {FlexRowComponent} from '../../shared/ui/layout/flex-row.component';
import {TitleComponent} from '../../shared/ui/layout/title.component';
import {FlexColumnComponent} from '../../shared/ui/layout/flex-column.component';
import {HomeLinkComponent} from '../../shared/ui/home-link.component';
import {firstValueFrom} from 'rxjs';
import {ContainerComponent} from '../../shared/ui/layout/container.component';
import {FormsModule} from '@angular/forms';
import {NotificationsService} from '../../shared/services/notifications.service';

@Component({
  selector: 'cm-orders-overview',
  host: {
    class: 'cm-host-expanded'
  },
  template: `
    <cm-container>
      <cm-flex-column>
        <cm-flex-row size="small" [center]="true">
          <cm-home-link></cm-home-link>

          <cm-title>Orders Overview</cm-title>

          @if (orders.isLoading()) {
            <cm-inline-circle-loader></cm-inline-circle-loader>
          }
        </cm-flex-row>

        @if (orders.hasValue()) {
          <cm-table-card [size]="'medium'">
            <table>
              <colgroup>
                <col span="1" style="width: 50%;">
                <col span="1" style="width: 20%;">
                <col span="1" style="width: 30%;">
              </colgroup>
              <thead>
              <tr>
                <th align="left">Delivery info</th>
                <th align="left">Total</th>
                <th align="left">Status</th>
              </tr>
              </thead>
              <tbody>
                @for (item of orders.value(); track item) {
                  <tr>
                    <td>
                      {{ item.delivery_info }} <br>
                      {{ item.delivery_date }}
                    </td>
                    <td>
                      {{ item.total_amount }} €
                    </td>
                    <td>
                      {{ item.status }}
                    </td>
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
    HomeLinkComponent,
    ContainerComponent,
    FormsModule,

  ],
  styles: `
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersOverviewComponent {
  constructor() {
  }

  withArchived = false;
  private readonly _ordersService = inject(OrdersService);
  readonly orders = resource({
    loader: () => {
      return firstValueFrom(this._ordersService.getOrders());
    },
  });
  private readonly _notificationsService = inject(NotificationsService);

}
