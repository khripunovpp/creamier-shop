import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { StockSet, StockSetsService } from '../stock-sets.service';
import { TableCardComponent } from '../../shared/ui/card/table-card.component';
import { InlineCircleLoaderComponent } from '../../shared/ui/inline-circle-loader.component';
import { FlexRowComponent } from '../../shared/ui/layout/flex-row.component';
import { FlexColumnComponent } from '../../shared/ui/layout/flex-column.component';
import { TitleComponent } from '../../shared/ui/layout/title.component';
import { ButtonComponent } from '../../shared/ui/controls/button/button.component';
import { PullDirective } from '../../shared/directives/pull.directive';
import { HomeLinkComponent } from '../../shared/ui/home-link.component';
import { ContainerComponent } from '../../shared/ui/layout/container.component';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { SwitchComponent } from '../../shared/ui/controls/switch.component';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { NotificationsService } from '../../shared/services/notifications.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'cm-stock-set-list',
  host: { class: 'cm-host-expanded' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cm-container>
      <cm-flex-column>
        <cm-flex-row [center]="true" size="small">
          <cm-home-link></cm-home-link>
          <cm-title>Sets</cm-title>
          @if (sets.isLoading()) {
            <cm-inline-circle-loader></cm-inline-circle-loader>
          }
          <cm-button appearance="primary" cmPull link="/stock-sets/create" size="tiny">Create</cm-button>
        </cm-flex-row>

        <cm-flex-row size="small">
          <cm-switch (ngModelChange)="sets.reload()" [(ngModel)]="withArchived">
            <span slot="left">With archived</span>
          </cm-switch>
        </cm-flex-row>

        @if (sets.hasValue()) {
          <cm-table-card [size]="'medium'">
            <table>
              <colgroup>
                <col style="width: 25%;">
                <col style="width: 15%;">
                <col style="width: 10%;">
                <col style="width: 10%;">
                <col style="width: 10%;">
                <col style="width: 30%;">
              </colgroup>
              <thead>
              <tr>
                <th align="left">Name (RU / PT)</th>
                <th align="left">Slug</th>
                <th align="left">Rules</th>
                <th align="left">Flavors</th>
                <th align="left">Status</th>
                <th align="right">Actions</th>
              </tr>
              </thead>
              <tbody>
                @for (s of items(); track s.id) {
                  <tr [class.cm-muted]="s.status === 'archived'">
                    <td><a [routerLink]="['/stock-sets', s.id]" class="cm-link">{{ s.name_ru }} · {{ s.name_pt }}</a>
                    </td>
                    <td>{{ s.slug }}</td>
                    <td>{{ s.rules?.length ?? 0 }}</td>
                    <td>{{ s.items?.length ?? 0 }}</td>
                    <td>
                      @switch (s.status) {
                        @case ('active') {
                          <cm-badge appearance="success">active</cm-badge>
                        }
                        @case ('stopped') {
                          <cm-badge>stopped</cm-badge>
                        }
                        @case ('archived') {
                          <cm-badge appearance="secondary">archived</cm-badge>
                        }
                      }
                    </td>
                    <td>
                      <cm-flex-column position="end" size="tiny">
                        <cm-flex-row size="tiny">
                          @if (s.status !== 'active') {
                            <cm-button (onClick)="activate(s)" appearance="success" size="tiny">Activate</cm-button>
                          }
                          @if (s.status === 'active') {
                            <cm-button (onClick)="deactivate(s)" appearance="warning" size="tiny">Deactivate</cm-button>
                          }
                        </cm-flex-row>
                        @if (s.status !== 'archived') {
                          <cm-button (onClick)="archive(s)" [flat]="true" appearance="danger" size="tiny">Archive
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
    TableCardComponent, InlineCircleLoaderComponent, FlexRowComponent, FlexColumnComponent,
    TitleComponent, ButtonComponent, PullDirective, HomeLinkComponent, ContainerComponent,
    BadgeComponent, SwitchComponent, FormsModule, RouterLink,
  ],
})
export class StockSetListComponent {
  withArchived = false;
  private readonly _service = inject(StockSetsService);
  private readonly _notif = inject(NotificationsService);

  readonly sets = resource({
    loader: () => firstValueFrom(this._service.getAll({ withArchived: this.withArchived })),
  });

  readonly items = computed(() => this.sets.value() ?? []);

  async activate(s: StockSet)   {
    try { await firstValueFrom(this._service.activate(s.id)   as any); this._notif.success('Activated');   this.sets.reload(); }
    catch { this._notif.error('Failed to activate'); }
  }
  async deactivate(s: StockSet) {
    try { await firstValueFrom(this._service.deactivate(s.id) as any); this._notif.success('Deactivated'); this.sets.reload(); }
    catch { this._notif.error('Failed to deactivate'); }
  }
  async archive(s: StockSet)    {
    try { await firstValueFrom(this._service.archive(s.id)    as any); this._notif.success('Archived');    this.sets.reload(); }
    catch { this._notif.error('Failed to archive'); }
  }
}
