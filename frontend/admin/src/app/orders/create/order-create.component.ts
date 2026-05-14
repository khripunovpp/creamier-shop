import {ChangeDetectionStrategy, Component, computed, inject, resource, signal} from '@angular/core';
import {Router} from '@angular/router';
import {firstValueFrom} from 'rxjs';
import {FlexColumnComponent} from '../../shared/ui/layout/flex-column.component';
import {FlexRowComponent} from '../../shared/ui/layout/flex-row.component';
import {TitleComponent} from '../../shared/ui/layout/title.component';
import {BackLinkComponent} from '../../shared/ui/back-link.component';
import {ContainerComponent} from '../../shared/ui/layout/container.component';
import {InlineCircleLoaderComponent} from '../../shared/ui/inline-circle-loader.component';
import {ButtonComponent} from '../../shared/ui/controls/button/button.component';
import {CardComponent} from '../../shared/ui/card/card.component';
import {NotificationsService} from '../../shared/services/notifications.service';
import {AdminCreateOrderDto, OrdersService} from '../orders.service';
import {StockSet, StockSetRule, StockSetsService} from '../../stock-sets/stock-sets.service';

interface LocalItem {
  rule_id: string;
  flavor_ids: string[];
  quantity: number;
  set_name: string;
  count: number;
  price: number;
  flavor_names: string[];
}

@Component({
  selector: 'cm-order-create',
  host: {class: 'cm-host-expanded'},
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cm-container>
      <cm-flex-column>
        <cm-flex-row size="small" [center]="true">
          <cm-back-link [segments]="['/orders']"></cm-back-link>
          <cm-title>New Order</cm-title>
        </cm-flex-row>

        <cm-flex-row size="small" [equal]="true">
          <cm-card>
            <cm-flex-column size="small">
              <cm-title [level]="4">Customer</cm-title>
              <label>Name *<input [value]="customer().name"
                                  (input)="setCustomer('name', $any($event.target).value)"></label>
              <label>Email<input type="email" [value]="customer().email"
                                 (input)="setCustomer('email', $any($event.target).value)"></label>
              <label>Phone<input type="tel" [value]="customer().phone_number"
                                 (input)="setCustomer('phone_number', $any($event.target).value)"></label>
              <label>Telegram<input [value]="customer().telegram"
                                    (input)="setCustomer('telegram', $any($event.target).value)"></label>
              <label>WhatsApp<input type="tel" [value]="customer().whatsapp"
                                    (input)="setCustomer('whatsapp', $any($event.target).value)"></label>
            </cm-flex-column>
          </cm-card>

          <cm-card>
            <cm-flex-column size="small">
              <cm-title [level]="4">Delivery</cm-title>
              <label>Type
                <select [value]="delivery().delivery_type"
                        (change)="setDelivery('delivery_type', $any($event.target).value)">
                  <option value="pickup">pickup</option>
                  <option value="delivery">delivery</option>
                </select>
              </label>
              <label>Date<input type="date" [value]="delivery().delivery_date"
                                (input)="setDelivery('delivery_date', $any($event.target).value)"></label>
              <label>Time<input type="text" placeholder="14:00–16:00"
                                [value]="delivery().delivery_time"
                                (input)="setDelivery('delivery_time', $any($event.target).value)"></label>
              @if (delivery().delivery_type === 'delivery') {
                <label>Address<input [value]="delivery().address"
                                     (input)="setDelivery('address', $any($event.target).value)"></label>
              }
              <label>Comment<textarea rows="2" [value]="delivery().comment"
                                      (input)="setDelivery('comment', $any($event.target).value)"></textarea></label>
            </cm-flex-column>
          </cm-card>
        </cm-flex-row>

        <cm-card>
          <cm-flex-column size="small">
            <cm-title [level]="4">Items</cm-title>
            @if (!items().length) {
              <div class="cm-muted">(no items yet — add below)</div>
            } @else {
              <table class="items-table">
                <thead>
                <tr>
                  <th>Set</th>
                  <th>Flavors</th>
                  <th>Count</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
                </thead>
                <tbody>
                  @for (it of items(); track $index) {
                    <tr>
                      <td>{{ it.set_name }}</td>
                      <td>{{ it.flavor_names.join(' + ') }}</td>
                      <td>{{ it.count }}</td>
                      <td>{{ it.quantity }}</td>
                      <td>{{ it.price }} €</td>
                      <td>{{ it.price * it.quantity }} €</td>
                      <td>
                        <cm-button size="tiny" appearance="danger" [flat]="true" (onClick)="removeItem($index)">✕
                        </cm-button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }

            <cm-title [level]="5">Add item</cm-title>
            <cm-flex-row size="small">
              <label>Set
                <select [value]="addForm().set_id"
                        (change)="setAdd('set_id', $any($event.target).value); setAdd('rule_id', ''); setAdd('flavor_ids', [])">
                  <option value="">—</option>
                  @for (s of setsRes.value() ?? []; track s.id) {
                    <option [value]="s.id">{{ s.name_ru }}</option>
                  }
                </select>
              </label>
              <label>Rule
                <select [value]="addForm().rule_id" [disabled]="!selectedSet()"
                        (change)="setAdd('rule_id', $any($event.target).value); setAdd('flavor_ids', [])">
                  <option value="">—</option>
                  @for (r of selectedSet()?.rules ?? []; track r.id) {
                    <option [value]="r.id">{{ r.count }} pcs · {{ r.price }} € · ≤ {{ r.max_flavors }} flavors</option>
                  }
                </select>
              </label>
              <label>Qty<input type="number" min="1" [value]="addForm().quantity"
                               (input)="setAdd('quantity', +$any($event.target).value)"></label>
            </cm-flex-row>

            @if (selectedSet() && selectedRule()) {
              <div class="cm-muted">Pick up to {{ selectedRule()!.max_flavors }} flavor(s):</div>
              <div class="flavors-pick">
                @for (it of selectedSet()!.items ?? []; track it.stock_item_id) {
                  @let id = it.stock_item?.id ?? it.stock_item_id;
                  @let on = addForm().flavor_ids.includes(id);
                  <button type="button" class="flavor-chip"
                          [class.flavor-chip--on]="on"
                          (click)="toggleAddFlavor(id)">
                    {{ it.stock_item?.name ?? id }}
                  </button>
                }
              </div>
              <cm-button size="tiny" appearance="primary"
                         [disabled]="!canAdd()"
                         (onClick)="addItem()">Add
              </cm-button>
            }

            <div class="totals">
              <div>Total: <strong>{{ totalAmount() }} €</strong></div>
            </div>
          </cm-flex-column>
        </cm-card>

        <cm-flex-row size="small" [center]="true">
          <cm-button appearance="primary"
                     [disabled]="!canSubmit() || submitting()"
                     (onClick)="submit()">Create Order
          </cm-button>
          @if (submitting()) {
            <cm-inline-circle-loader></cm-inline-circle-loader>
          }
        </cm-flex-row>
      </cm-flex-column>
    </cm-container>
  `,
  imports: [
    FlexColumnComponent, FlexRowComponent, TitleComponent, BackLinkComponent,
    ContainerComponent, InlineCircleLoaderComponent, ButtonComponent, CardComponent,
  ],
  styles: `
    .cm-muted {
      color: #888;
      font-size: 12px;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 12px;
      color: #444;
    }

    input, select, textarea {
      padding: 6px 8px;
      border: 1px solid #ddd;
      background: #fff;
      font: inherit;
      color: #222;
    }

    textarea {
      resize: vertical;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
    }

    .items-table th, .items-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #eee;
      text-align: left;
    }

    .flavors-pick {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 8px 0;
    }

    .flavor-chip {
      padding: 4px 10px;
      border: 1px solid #ccc;
      background: #fff;
      cursor: pointer;
      font-size: 12px;
      color: #333;
    }

    .flavor-chip:hover {
      border-color: rgba(0, 0, 0, .3);
    }

    .flavor-chip--on {
      background: var(--p-1, #2D4A3A);
      color: #fff;
      border-color: var(--p-1, #2D4A3A);
    }

    .totals {
      margin-top: 8px;
    }
  `,
})
export class OrderCreateComponent {
  readonly customer = signal({
    name: '', email: '', phone_number: '', telegram: '', whatsapp: '',
  });
  readonly delivery = signal<{
    delivery_type: 'pickup' | 'delivery';
    delivery_date: string;
    delivery_time: string;
    address: string;
    comment: string;
  }>({
    delivery_type: 'pickup', delivery_date: '', delivery_time: '', address: '', comment: '',
  });
  readonly items = signal<LocalItem[]>([]);
  readonly addForm = signal<{
    set_id: string; rule_id: string; flavor_ids: string[]; quantity: number;
  }>({set_id: '', rule_id: '', flavor_ids: [], quantity: 1});
  readonly submitting = signal(false);
  readonly selectedSet = computed<StockSet | undefined>(() =>
    (this.setsRes.value() ?? []).find(s => s.id === this.addForm().set_id));
  readonly selectedRule = computed<StockSetRule | undefined>(() =>
    this.selectedSet()?.rules?.find(r => r.id === this.addForm().rule_id));
  readonly canAdd = computed(() => {
    const f = this.addForm();
    const r = this.selectedRule();
    return !!r && f.flavor_ids.length > 0 && f.flavor_ids.length <= r.max_flavors && f.quantity > 0;
  });
  readonly canSubmit = computed(() =>
    this.customer().name.trim().length > 0 && this.items().length > 0,
  );
  readonly totalAmount = computed(() =>
    this.items().reduce((sum, it) => sum + it.price * it.quantity, 0),
  );
  private readonly _service = inject(OrdersService);
  private readonly _setsService = inject(StockSetsService);
  readonly setsRes = resource({
    loader: () => firstValueFrom(this._setsService.getAll({withArchived: false})),
  });
  private readonly _notif = inject(NotificationsService);
  private readonly _router = inject(Router);

  setCustomer(key: keyof ReturnType<typeof this.customer>, value: string) {
    this.customer.update(c => ({...c, [key]: value}));
  }

  setDelivery(key: keyof ReturnType<typeof this.delivery>, value: string) {
    this.delivery.update(d => ({...d, [key]: value as any}));
  }

  setAdd<K extends keyof ReturnType<typeof this.addForm>>(key: K, value: any) {
    this.addForm.update(f => ({...f, [key]: value}));
  }

  toggleAddFlavor(id: string) {
    this.addForm.update(f => {
      const max = this.selectedRule()?.max_flavors ?? 1;
      if (f.flavor_ids.includes(id)) return {...f, flavor_ids: f.flavor_ids.filter(x => x !== id)};
      if (f.flavor_ids.length >= max) return f;
      return {...f, flavor_ids: [...f.flavor_ids, id]};
    });
  }

  addItem(): void {
    const set = this.selectedSet();
    const rule = this.selectedRule();
    if (!set || !rule || !this.canAdd()) return;
    const f = this.addForm();
    const flavorNames = f.flavor_ids.map(id => {
      const link = (set.items ?? []).find(l => (l.stock_item?.id ?? l.stock_item_id) === id);
      return link?.stock_item?.name ?? id;
    });
    this.items.update(arr => [...arr, {
      rule_id: f.rule_id,
      flavor_ids: [...f.flavor_ids],
      quantity: f.quantity,
      set_name: set.name_ru,
      count: rule.count,
      price: rule.price,
      flavor_names: flavorNames,
    }]);
    this.addForm.set({set_id: '', rule_id: '', flavor_ids: [], quantity: 1});
  }

  removeItem(idx: number): void {
    this.items.update(arr => arr.filter((_, i) => i !== idx));
  }

  async submit(): Promise<void> {
    if (!this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    const c = this.customer();
    const d = this.delivery();
    const dto: AdminCreateOrderDto = {
      items: this.items().map(it => ({
        stock_set_rule_id: it.rule_id,
        flavor_ids: it.flavor_ids,
        quantity: it.quantity,
      })),
      name: c.name.trim(),
      email: c.email.trim() || null,
      phone_number: c.phone_number.trim() || null,
      telegram: c.telegram.trim() || null,
      whatsapp: c.whatsapp.trim() || null,
      delivery_date: d.delivery_date ? new Date(d.delivery_date + 'T00:00:00').toISOString() : null,
      delivery_time: d.delivery_time.trim() || null,
      delivery_info: d.delivery_type === 'delivery' && d.address.trim() ? {address: d.address.trim()} : null,
      delivery_type: d.delivery_type,
      comment: d.comment.trim() || null,
    };
    try {
      const res = await firstValueFrom(this._service.createOrder(dto));
      this._notif.success('Order created');
      this.submitting.set(false);
      this._router.navigate(['/orders', res.id]);
    } catch (err: any) {
      this.submitting.set(false);
      this._notif.error(err?.error?.error ?? 'Failed to create order');
    }
  }
}
