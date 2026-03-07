import {ChangeDetectionStrategy, Component, inject, resource} from '@angular/core';
import {Order, OrdersService} from '../orders.service';
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
import {DatePipe} from '@angular/common';
import {ButtonComponent} from '../../shared/ui/controls/button/button.component';
import {canMarkDelivered, canMarkPaidDelivered, canMarkPaidUndelivered} from '../orders.helpers';
import {BadgeComponent} from '../../shared/ui/badge.component';
import {RouterLink} from '@angular/router';

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

        @if (orders.value()?.length) {
          <cm-table-card [size]="'medium'">
            <table>
              <colgroup>
                <col span="1" style="width: 35%;">
                <col span="1" style="width: 15%;">
                <col span="1" style="width: 20%;">
                <col span="1" style="width: 10%;">
                <col span="1" style="width: 20%;">
              </colgroup>
              <thead>
              <tr>
                <th align="left">Delivery info</th>
                <th align="left">Delivery date</th>
                <th align="left">Total</th>
                <th align="left">Status</th>
                <th align="right">Actions</th>
              </tr>
              </thead>
              <tbody>
                @for (item of orders.value(); track item) {
                  <tr>
                    <td>
                      @if (isNewOrder(item)) {
                        <cm-badge appearance="success">New</cm-badge><br>
                      }
                      <a class="cm-link"
                         [routerLink]="['/orders', item.id]">
                        @if (item.delivery_info) {
                          {{ item.delivery_info.postalCode }}<br>
                          {{ item.delivery_info.addressLine1 }}<br>
                          {{ item.delivery_info.addressLine2 }}
                        } @else if (item.delivery_type === 'pickup') {
                          Pickup
                        } @else {
                          No address
                        }
                      </a>
                    </td>
                    <td>
                      @if (item.delivery_date) {
                        {{ item.delivery_date | date:'HH:mm, dd.MM.yyyy' }}
                      } @else {
                        -
                      }
                    </td>
                    <td>
                      <div>{{ item.total_amount }} €</div>
                      <div> {{ item.profit_amount }} € profit</div>
                      @if (item.discount_amount) {
                        <div> {{ item.discount_amount }} € discount</div>
                      }
                    </td>
                    <td>
                      {{ item.status }}
                    </td>
                    <td>
                      <cm-flex-column size="tiny" position="end">
                        <cm-flex-row size="tiny">

                          @if (canMarkPaid(item)) {
                            <cm-button appearance="warning"
                                       (click)="onMarkPaid(item)"
                                       size="tiny">
                              Mark Paid
                            </cm-button>
                          }

                          @if (canMarkDelivered(item)) {
                            <cm-button appearance="success"
                                       (click)="onMarkDelivered(item)"
                                       size="tiny">
                              Mark Delivered
                            </cm-button>
                          }
                        </cm-flex-row>
                      </cm-flex-column>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </cm-table-card>
        } @else {
          <div>No orders yet</div>
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
    DatePipe,
    ButtonComponent,
    BadgeComponent,
    RouterLink,

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

  canMarkPaid(order: Order) {
    if (order.paid_at) return false;
    return canMarkPaidDelivered(order)
      || canMarkPaidUndelivered(order);
  }

  canMarkDelivered(order: Order) {
    return canMarkDelivered(order);
  }

  onMarkPaid(order: Order) {
    this._ordersService.markOrderPaid(order.id, {
      payment_method: 'cash',
      payment_data: '',
    }).subscribe({
      next: () => {
        this._notificationsService.success("Order marked as paid");
        this.orders.reload();
      },
      error: (err) => {
        this._notificationsService.error("Failed to mark order as paid");
        console.error("Failed to mark order as paid", err);
      }
    });
  }

  onMarkDelivered(order: Order) {
    this._ordersService.markOrderDelivered(order.id)
      .subscribe({
        next: () => {
          this._notificationsService.success("Order marked as delivered");
          this.orders.reload();
        },
        error: (err) => {
          this._notificationsService.error("Failed to mark order as delivered");
          console.error("Failed to mark order as delivered", err);
        }
      });
  }

  isNewOrder(order: Order) {
    return order.status === 'created';
  }
}
