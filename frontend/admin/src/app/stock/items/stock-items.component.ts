import {ChangeDetectionStrategy, Component, inject, resource, viewChild} from '@angular/core';
import {StockItem, StockService} from '../stock.service';
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
import {FormsModule} from '@angular/forms';
import {BadgeComponent} from '../../shared/ui/badge.component';
import {NotificationsService} from '../../shared/services/notifications.service';
import {RouterLink} from '@angular/router';
import {SwitchComponent} from '../../shared/ui/controls/switch.component';
import {StockMoveActionComponent} from '../moving/stock-move-action.component';

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
                     appearance="primary"
                     size="tiny">Create
          </cm-button>
        </cm-flex-row>

        <cm-flex-row size="small">
          <cm-switch [(ngModel)]="withArchived"
                     (ngModelChange)="stock.reload()">
            <span slot="left">With archived</span>
          </cm-switch>
        </cm-flex-row>

        @if (stock.hasValue()) {
          <cm-table-card [size]="'medium'">
            <table>
              <colgroup>
                <col span="1" style="width: 20%;">
                <col span="1" style="width: 10%;">
                <col span="1" style="width: 10%;">
                <col span="1" style="width: 10%;">
                <col span="1" style="width: 10%;">
                <col span="1" style="width: 20%;">
              </colgroup>
              <thead>
              <tr>
                <th align="left">Name|Status</th>
                <th align="left">Price</th>
                <th align="left">Cost</th>
                <th align="left">Profit</th>
                <th align="left">Quantity</th>
                <th align="right">Actions</th>
              </tr>
              </thead>
              <tbody>
                @for (item of stock.value(); track item) {
                  <tr [class.cm-muted]="isArchived(item)">
                    <td>
                      <a class="cm-link"
                         [routerLink]="['/stock', item.id]">
                        {{ item.name }}
                      </a>
                      @if (isStopped(item)) {
                        <cm-badge>{{ item.status }}</cm-badge>
                      }
                      @if (isArchived(item)) {
                        <cm-badge appearance="secondary">{{ item.status }}</cm-badge>
                      }
                    </td>
                    <td>
                      {{ item.price }}
                    </td>
                    <td>{{ item.cost_price }}</td>
                    <td>{{ item.price - item.cost_price }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>
                      <cm-flex-column size="tiny" position="end">
                        <cm-flex-row size="tiny">
                          @if (canActivate(item)) {
                            <cm-button appearance="success"
                                       (onClick)="activate(item)"
                                       size="tiny">Activate
                            </cm-button>
                          }
                          @if (canDeactivate(item)) {
                            <cm-button size="tiny"
                                       (onClick)="deactivate(item)"
                                       appearance="warning">
                              Deactivate
                            </cm-button>
                          }

                          @if (canAdjust(item)) {
                            <cm-button size="tiny"
                                       (onClick)="openMovingDialog(item)"
                                       appearance="primary">
                              Adjust
                            </cm-button>
                          }
                        </cm-flex-row>

                        @if (canArchive(item)) {
                          <cm-button size="tiny"
                                     [flat]="true"
                                     (onClick)="archive(item)"
                                     appearance="danger">
                            Archive
                          </cm-button>
                        }
                      </cm-flex-column>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </cm-table-card>
        }
      </cm-flex-column>
    </cm-container>

    <cm-stock-move-action (onConfirm)="stock.reload()"></cm-stock-move-action>
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
    ContainerComponent,
    FormsModule,
    BadgeComponent,
    RouterLink,
    SwitchComponent,
    StockMoveActionComponent,
  ],
  styles: `
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockItemsComponent {
  constructor() {
  }

  readonly moveDialog = viewChild(StockMoveActionComponent);
  withArchived = false;
  private readonly _stockService = inject(StockService);
  readonly stock = resource({
    loader: () => {
      return firstValueFrom(this._stockService.getProducts({
        withArchived: this.withArchived,
      }));
    },
  });
  private readonly _notificationsService = inject(NotificationsService);

  canActivate(
    item: StockItem
  ) {
    return item.quantity >= 0
      && ['stopped', 'archived'].includes(item.status);
  }

  canDeactivate(
    item: StockItem
  ) {
    return item.status === 'active';
  }

  canArchive(
    item: StockItem
  ) {
    return item.status !== 'archived';
  }

  canAdjust(
    item: StockItem
  ) {
    return item.status !== 'archived';
  }

  isStopped(
    item: StockItem
  ) {
    return item.status === 'stopped';
  }

  isArchived(
    item: StockItem
  ) {
    return item.status === 'archived';
  }

  async activate(
    item: StockItem
  ) {
    try {
      await this._stockService.activateProduct(item.id);
      this._notificationsService.success('Product activated successfully');
      this.stock.reload();
    } catch (e) {
      console.error('Failed to activate product', e);
      this._notificationsService.error('Failed to activate product');
    }
  }

  async deactivate(
    item: StockItem
  ) {
    try {
      await this._stockService.deactivateProduct(item.id);
      this._notificationsService.success('Product deactivated successfully');
      this.stock.reload();
    } catch (e) {
      console.error('Failed to deactivate product', e);
      this._notificationsService.error('Failed to deactivate product');
    }
  }

  async archive(
    item: StockItem
  ) {
    try {
      await this._stockService.archiveProduct(item.id);
      this._notificationsService.success('Product archived successfully');
      this.stock.reload();
    } catch (e) {
      console.error('Failed to archive product', e);
      this._notificationsService.error('Failed to archive product');
    }
  }

  openMovingDialog(
    item: StockItem
  ) {
    this.moveDialog()?.open(item);
  }
}
