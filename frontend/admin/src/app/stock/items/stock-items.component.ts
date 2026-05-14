import { ChangeDetectionStrategy, Component, computed, inject, resource, viewChild } from '@angular/core';
import { StockItem, StockService } from '../stock.service';
import { TableCardComponent } from '../../shared/ui/card/table-card.component';
import { InlineCircleLoaderComponent } from '../../shared/ui/inline-circle-loader.component';
import { FlexRowComponent } from '../../shared/ui/layout/flex-row.component';
import { TitleComponent } from '../../shared/ui/layout/title.component';
import { FlexColumnComponent } from '../../shared/ui/layout/flex-column.component';
import { ButtonComponent } from '../../shared/ui/controls/button/button.component';
import { PullDirective } from '../../shared/directives/pull.directive';
import { HomeLinkComponent } from '../../shared/ui/home-link.component';
import { firstValueFrom } from 'rxjs';
import { ContainerComponent } from '../../shared/ui/layout/container.component';
import { FormsModule } from '@angular/forms';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { NotificationsService } from '../../shared/services/notifications.service';
import { RouterLink } from '@angular/router';
import { SwitchComponent } from '../../shared/ui/controls/switch.component';

@Component({
  selector: 'cm-stock-items',
  host: { class: 'cm-host-expanded' },
  template: `
    <cm-container>
      <cm-flex-column>
        <cm-flex-row [center]="true" size="small">
          <cm-home-link></cm-home-link>
          <cm-title>Stock</cm-title>
          @if (stock.isLoading()) {
            <cm-inline-circle-loader></cm-inline-circle-loader>
          }
          <cm-button appearance="primary" cmPull link="/stock/create" size="tiny">Create</cm-button>
        </cm-flex-row>

        <cm-flex-row size="small">
          <cm-switch (ngModelChange)="stock.reload()" [(ngModel)]="withArchived">
            <span slot="left">With archived</span>
          </cm-switch>
        </cm-flex-row>

        @if (stock.hasValue()) {
          <cm-table-card [size]="'medium'">
            <table>
              <colgroup>
                <col style="width: 50%;">
                <col style="width: 26%;">
                <col style="width: 18%;">
              </colgroup>
              <thead>
              <tr>
                <th align="left">Name</th>
                <th align="left">Product cost</th>
                <th align="right">Actions</th>
              </tr>
              </thead>
              <tbody>
                @for (item of items(); track item.id) {
                  <tr [class.cm-muted]="isArchived(item)">
                    <td>
                      <a [routerLink]="['/stock', item.id]" class="cm-link">{{ item.name }} ({{ item.name_pt }})</a>
                      @if (item.badge) {
                        <cm-badge appearance="success">{{ item.badge }}</cm-badge>
                      }
                      @if (isStopped(item)) {
                        <cm-badge>{{ item.status }}</cm-badge>
                      }
                      @if (isArchived(item)) {
                        <cm-badge appearance="secondary">{{ item.status }}</cm-badge>
                      }
                    </td>
                    <td>{{ item.cost_price }} €</td>
                    <td>
                      <cm-flex-column position="end" size="tiny">
                        <cm-flex-row size="tiny">
                          @if (canActivate(item)) {
                            <cm-button (onClick)="activate(item)" appearance="success" size="tiny">Activate</cm-button>
                          }
                          @if (canDeactivate(item)) {
                            <cm-button (onClick)="deactivate(item)" appearance="warning" size="tiny">Deactivate
                            </cm-button>
                          }
                        </cm-flex-row>
                        @if (canArchive(item)) {
                          <cm-button (onClick)="archive(item)" [flat]="true" appearance="danger" size="tiny">Archive
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
  ],
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockItemsComponent {
  withArchived = false;
  private readonly _stockService = inject(StockService);
  private readonly _notificationsService = inject(NotificationsService);

  readonly stock = resource({
    loader: () => firstValueFrom(this._stockService.getProducts({ withArchived: this.withArchived })),
  });

  readonly items = computed(() => this.stock.value() ?? []);

  canActivate(i: StockItem)   { return ['stopped', 'archived'].includes(i.status); }
  canDeactivate(i: StockItem) { return i.status === 'active'; }
  canArchive(i: StockItem)    { return i.status !== 'archived'; }
  isStopped(i: StockItem)     { return i.status === 'stopped'; }
  isArchived(i: StockItem)    { return i.status === 'archived'; }

  async activate(item: StockItem) {
    try {
      await this._stockService.activateProduct(item.id);
      this._notificationsService.success('Activated');
      this.stock.reload();
    } catch (e) { this._notificationsService.error('Failed to activate'); }
  }

  async deactivate(item: StockItem) {
    try {
      await this._stockService.deactivateProduct(item.id);
      this._notificationsService.success('Deactivated');
      this.stock.reload();
    } catch (e) { this._notificationsService.error('Failed to deactivate'); }
  }

  async archive(item: StockItem) {
    try {
      await this._stockService.archiveProduct(item.id);
      this._notificationsService.success('Archived');
      this.stock.reload();
    } catch (e) { this._notificationsService.error('Failed to archive'); }
  }
}
