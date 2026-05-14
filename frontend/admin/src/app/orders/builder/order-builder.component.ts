import {ChangeDetectionStrategy, Component, computed, effect, HostListener, inject, resource, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {firstValueFrom} from 'rxjs';
import {DatePipe} from '@angular/common';

import {FlexColumnComponent} from '../../shared/ui/layout/flex-column.component';
import {FlexRowComponent} from '../../shared/ui/layout/flex-row.component';
import {TitleComponent} from '../../shared/ui/layout/title.component';
import {BackLinkComponent} from '../../shared/ui/back-link.component';
import {ContainerComponent} from '../../shared/ui/layout/container.component';
import {InlineCircleLoaderComponent} from '../../shared/ui/inline-circle-loader.component';
import {ButtonComponent} from '../../shared/ui/controls/button/button.component';
import {CardComponent} from '../../shared/ui/card/card.component';
import {BadgeComponent} from '../../shared/ui/badge.component';
import {ControlComponent} from '../../shared/ui/controls/control-item/control.component';
import {InputComponent} from '../../shared/ui/controls/input.component';
import {NumberInputComponent} from '../../shared/ui/controls/number-input.component';
import {TextareaComponent} from '../../shared/ui/controls/textarea.component';
import {RadioComponent} from '../../shared/ui/controls/radio.component';
import {DatePickerComponent} from '../../shared/ui/controls/date-picker.component';
import {MultiselectComponent} from '../../shared/ui/controls/multiselect.component';
import {NotificationsService} from '../../shared/services/notifications.service';
import {injectParams} from '../../shared/helpers/route.helpers';
import {AdminAddItemDto, AdminUpdateOrderDto, Order, OrderItem, OrdersService,} from '../orders.service';
import {canMarkDelivered, canMarkPaidDelivered, canMarkPaidUndelivered, orderIsDelivered,} from '../orders.helpers';
import {StockSet, StockSetRule, StockSetsService} from '../../stock-sets/stock-sets.service';
import {TIME_SLOTS} from '../../../../../shared/time-slots';

@Component({
  selector: 'cm-order-builder',
  host: {class: 'cm-host-expanded'},
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <cm-container>
      <cm-flex-column>
        <cm-flex-row [center]="true" size="small">
          <cm-back-link [segments]="['/orders']"></cm-back-link>
          <cm-title>Order</cm-title>
          @if (stored.isLoading()) {
            <cm-inline-circle-loader></cm-inline-circle-loader>
          }
        </cm-flex-row>

        @let order = stored.value();
        @if (order) {
          <cm-flex-row [center]="true" size="small">
            <span class="cm-mono">#{{ order.id }}</span>
            @switch (order.status) {
              @case ('created') {
                <cm-badge>created</cm-badge>
              }
              @case ('paid') {
                <cm-badge appearance="success">paid</cm-badge>
              }
              @case ('delivered') {
                <cm-badge appearance="success">delivered</cm-badge>
              }
              @case ('cancelled') {
                <cm-badge appearance="secondary">cancelled</cm-badge>
              }
              @case ('returned') {
                <cm-badge appearance="danger">returned</cm-badge>
              }
            }
            <span class="cm-muted">created: {{ order.created_at | date:'short' }}</span>
            @if (order.paid_at) {
              <span class="cm-muted">paid: {{ order.paid_at | date:'short' }}</span>
            }
            @if (order.completed_at) {
              <span class="cm-muted">delivered: {{ order.completed_at | date:'short' }}</span>
            }
          </cm-flex-row>

          <cm-flex-row size="small">
            @if (canMarkPaid(order)) {
              <cm-button (onClick)="markPaid(order)" appearance="success" size="tiny">Mark Paid</cm-button>
            }
            @if (canMarkDeliveredOrder(order)) {
              <cm-button (onClick)="markDelivered(order)" appearance="primary" size="tiny">Mark Delivered</cm-button>
            }
            @if (canTerminate(order)) {
              <cm-button (onClick)="setStatus('cancelled')" [flat]="true" appearance="danger" size="tiny">Cancel
              </cm-button>
              <cm-button (onClick)="setStatus('returned')" [flat]="true" appearance="warning" size="tiny">Return
              </cm-button>
            }
          </cm-flex-row>

          <cm-flex-row [equal]="true" size="small">
            <cm-card>
              <cm-flex-column size="small">
                <cm-title [level]="4">Customer</cm-title>
                <cm-control label="Name">
                  <cm-input [ngModel]="customerForm().name"
                            (ngModelChange)="setCustomer('name', $event)"></cm-input>
                </cm-control>
                <cm-control label="Email">
                  <cm-input inputType="email"
                            [ngModel]="customerForm().email"
                            (ngModelChange)="setCustomer('email', $event)"></cm-input>
                </cm-control>
                <cm-control label="Phone">
                  <cm-input inputType="tel"
                            [ngModel]="customerForm().phone_number"
                            (ngModelChange)="setCustomer('phone_number', $event)"></cm-input>
                </cm-control>
                <cm-control label="Telegram">
                  <cm-input [ngModel]="customerForm().telegram"
                            (ngModelChange)="setCustomer('telegram', $event)"></cm-input>
                </cm-control>
                <cm-control label="WhatsApp">
                  <cm-input inputType="tel"
                            [ngModel]="customerForm().whatsapp"
                            (ngModelChange)="setCustomer('whatsapp', $event)"></cm-input>
                </cm-control>
                <cm-button (onClick)="saveCustomer()" appearance="primary" size="tiny">Save customer</cm-button>
              </cm-flex-column>
            </cm-card>

            <cm-card>
              <cm-flex-column size="small">
                <cm-title [level]="4">Delivery</cm-title>
                <cm-control label="Type">
                  <cm-flex-row size="small">
                    <cm-radio size="small" payload="pickup"
                              [value]="deliveryForm().delivery_type"
                              (valueChange)="setDelivery('delivery_type', $event)">pickup
                    </cm-radio>
                    <cm-radio size="small" payload="delivery"
                              [value]="deliveryForm().delivery_type"
                              (valueChange)="setDelivery('delivery_type', $event)">delivery
                    </cm-radio>
                  </cm-flex-row>
                </cm-control>
                <cm-control label="Date">
                  <cm-date-picker [value]="deliveryForm().delivery_date"
                                  (valueChange)="setDelivery('delivery_date', $event)"></cm-date-picker>
                </cm-control>
                <cm-control label="Time">
                  <cm-multiselect name="time"
                                  [staticItems]="timeSlots"
                                  [ngModel]="deliveryForm().delivery_time"
                                  (ngModelChange)="setDelivery('delivery_time', $event ?? '')"></cm-multiselect>
                </cm-control>
                @if (deliveryForm().delivery_type === 'delivery') {
                  <cm-control label="Address">
                    <cm-input [ngModel]="deliveryForm().address"
                              (ngModelChange)="setDelivery('address', $event)"></cm-input>
                  </cm-control>
                }
                <cm-control label="Comment">
                  <cm-textarea [ngModel]="deliveryForm().comment"
                               (ngModelChange)="setDelivery('comment', $event)"></cm-textarea>
                </cm-control>
                <cm-button (onClick)="saveDelivery()" appearance="primary" size="tiny">Save delivery</cm-button>
              </cm-flex-column>
            </cm-card>
          </cm-flex-row>

          <cm-card>
            <cm-flex-column size="small">
              <cm-title [level]="4">Items</cm-title>
              @if (!order.items?.length) {
                <div class="cm-muted">(no items yet)</div>
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
                    @for (it of order.items; track it.id) {
                      <tr>
                        <td>{{ it.set_slug ?? '—' }}</td>
                        <td>{{ flavorsLabel(it) }}</td>
                        <td>{{ it.set_count ?? '—' }}</td>
                        <td class="qty-cell">
                          <cm-number-input [ngModel]="itemQtyEdits()[it.id] ?? it.quantity"
                                           (ngModelChange)="setQty(it.id, +$event)"></cm-number-input>
                        </td>
                        <td>{{ it.price }} €</td>
                        <td>{{ it.price * (itemQtyEdits()[it.id] ?? it.quantity) }} €</td>
                        <td>
                          <cm-button (onClick)="saveQty(order.id, it)" appearance="primary" size="tiny">Save</cm-button>
                          <cm-button (onClick)="removeItem(order.id, it)" [flat]="true" appearance="danger"
                                     size="tiny">Delete
                          </cm-button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              }

              <cm-title [level]="5">Add item</cm-title>
              <cm-flex-row size="small">
                <cm-control label="Set">
                  <cm-multiselect name="set"
                                  [staticItems]="setsRes.value() ?? []"
                                  [compareField]="'id'"
                                  [labelFactory]="setLabel"
                                  [ngModel]="selectedSet() ?? null"
                                  (ngModelChange)="onSetChange($event)"></cm-multiselect>
                </cm-control>
                <cm-control label="Rule">
                  <cm-multiselect name="rule"
                                  [staticItems]="selectedSet()?.rules ?? []"
                                  [compareField]="'id'"
                                  [labelFactory]="ruleLabel"
                                  [ngModel]="selectedRule() ?? null"
                                  (ngModelChange)="onRuleChange($event)"></cm-multiselect>
                </cm-control>
                <cm-control label="Qty">
                  <cm-number-input [ngModel]="addForm().quantity"
                                   (ngModelChange)="setAdd('quantity', +$event)"></cm-number-input>
                </cm-control>
              </cm-flex-row>

              @if (selectedSet() && selectedRule()) {
                <div class="cm-muted">
                  Pick up to {{ selectedRule()!.max_flavors }} flavor(s):
                </div>
                <div class="flavors-pick">
                  @for (it of selectedSet()!.items ?? []; track it.stock_item_id) {
                    @let id = it.stock_item?.id ?? it.stock_item_id;
                    @let on = addForm().flavor_ids.includes(id);
                    <button (click)="toggleAddFlavor(id)" [class.flavor-chip--on]="on"
                            class="flavor-chip"
                            type="button">
                      {{ it.stock_item?.name ?? id }}
                    </button>
                  }
                </div>
                <cm-button (onClick)="addItem(order.id)" [disabled]="!canAdd()"
                           appearance="primary"
                           size="tiny">Add
                </cm-button>
              }

              <div class="totals">
                <div>Total: <strong>{{ order.total_amount }} €</strong></div>
                @if (order.discount_amount) {
                  <div>Discount: {{ order.discount_amount }} €</div>
                }
                <div >Profit: {{ order.profit_amount }} €</div>
              </div>
            </cm-flex-column>
          </cm-card>
        }
      </cm-flex-column>
    </cm-container>
  `,
  imports: [
    FlexColumnComponent, FlexRowComponent, TitleComponent, BackLinkComponent,
    ContainerComponent, InlineCircleLoaderComponent, ButtonComponent, CardComponent,
    BadgeComponent, DatePipe, FormsModule,
    ControlComponent, InputComponent, NumberInputComponent, TextareaComponent,
    RadioComponent, DatePickerComponent, MultiselectComponent,
  ],
  styles: `
    :host {
      --control-bg: var(--control-bg-contrast);
     --control-bg-selected: #4caf50;
    }

    .cm-mono {
      font-family: ui-monospace, monospace;
      font-size: 12px;
      color: #555;
    }

    .cm-muted {
      color: #888;
      font-size: 12px;
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

    .qty-cell {
      width: 120px;
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
      transition: border-color .15s, background .15s;
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
      display: flex;
      gap: 24px;
      align-items: baseline;
    }
  `,
})
export class OrderBuilderComponent {
  readonly uuid = injectParams<string>('uuid');
  // ── editable form state ────────────────────────────────────────────────────
  readonly customerForm = signal({
    name: '', email: '', phone_number: '', telegram: '', whatsapp: '',
  });
  readonly deliveryForm = signal<{
    delivery_type: 'pickup' | 'delivery';
    delivery_date: Date | null;
    delivery_time: string;
    address: string;
    comment: string;
  }>({
    delivery_type: 'pickup',
    delivery_date: null,
    delivery_time: '',
    address: '',
    comment: '',
  });
  readonly itemQtyEdits = signal<Record<string, number>>({});

  readonly dirty = signal(false);
  readonly addForm = signal<{
    set: StockSet | null;
    rule: StockSetRule | null;
    flavor_ids: string[];
    quantity: number;
  }>({
    set: null, rule: null, flavor_ids: [], quantity: 1,
  });
  readonly selectedSet = computed<StockSet | undefined>(() => this.addForm().set ?? undefined);
  readonly selectedRule = computed<StockSetRule | undefined>(() => this.addForm().rule ?? undefined);
  readonly canAdd = computed(() => {
    const f = this.addForm();
    const r = this.selectedRule();
    return !!r && f.flavor_ids.length > 0
      && f.flavor_ids.length <= r.max_flavors
      && f.quantity > 0;
  });
  readonly timeSlots: string[] = [...TIME_SLOTS];
  readonly _hydrate = effect(() => {
    const o = this.stored.value();
    if (!o) return;
    this.customerForm.set({
      name: o.customer?.name ?? '',
      email: o.customer?.email ?? '',
      phone_number: o.customer?.phone_number ?? '',
      telegram: o.customer?.telegram ?? '',
      whatsapp: o.customer?.whatsapp ?? '',
    });
    this.deliveryForm.set({
      delivery_type: o.delivery_type ?? 'pickup',
      delivery_date: o.delivery_date ? new Date(o.delivery_date) : null,
      delivery_time: ((o.delivery_info as any)?.time as string) ?? '',
      address: ((o.delivery_info as any)?.address as string) ?? '',
      comment: o.comment ?? '',
    });
    const qty: Record<string, number> = {};
    for (const it of o.items ?? []) qty[it.id] = it.quantity;
    this.itemQtyEdits.set(qty);
    this.addForm.set({set: null, rule: null, flavor_ids: [], quantity: 1});
    this.dirty.set(false);
  });
  private readonly _service = inject(OrdersService);
  readonly stored = resource({
    params: () => ({uuid: this.uuid()}),
    loader: ({params}) => {
      if (!params.uuid) return Promise.resolve(null);
      return firstValueFrom(this._service.getOneOrder(params.uuid));
    },
  });
  private readonly _setsService = inject(StockSetsService);
  readonly setsRes = resource({
    loader: () => firstValueFrom(this._setsService.getAll({withArchived: false})),
  });
  private readonly _notif = inject(NotificationsService);

  readonly setLabel = (s: StockSet) => s.name_ru;

  readonly ruleLabel = (r: StockSetRule) =>
    `${r.count} pcs · ${r.price} € · ≤ ${r.max_flavors} flavors`;

  // ── helpers ────────────────────────────────────────────────────────────────
  setCustomer<K extends keyof ReturnType<typeof this.customerForm>>(key: K, value: string) {
    this.dirty.set(true);
    this.customerForm.update(c => ({...c, [key]: value}));
  }

  setDelivery<K extends keyof ReturnType<typeof this.deliveryForm>>(key: K, value: unknown) {
    this.dirty.set(true);
    this.deliveryForm.update(d => ({...d, [key]: value as any}));
  }

  setQty(itemId: string, value: number) {
    this.dirty.set(true);
    this.itemQtyEdits.update(m => ({...m, [itemId]: Math.max(1, value | 0)}));
  }

  setAdd<K extends keyof ReturnType<typeof this.addForm>>(key: K, value: any) {
    this.dirty.set(true);
    this.addForm.update(f => ({...f, [key]: value}));
  }

  onSetChange(s: StockSet | null) {
    this.dirty.set(true);
    this.addForm.update(f => ({...f, set: s ?? null, rule: null, flavor_ids: []}));
  }

  onRuleChange(r: StockSetRule | null) {
    this.dirty.set(true);
    this.addForm.update(f => ({...f, rule: r ?? null, flavor_ids: []}));
  }

  toggleAddFlavor(id: string) {
    this.dirty.set(true);
    this.addForm.update(f => {
      const max = this.selectedRule()?.max_flavors ?? 1;
      const has = f.flavor_ids.includes(id);
      if (has) return {...f, flavor_ids: f.flavor_ids.filter(x => x !== id)};
      if (f.flavor_ids.length >= max) return f;
      return {...f, flavor_ids: [...f.flavor_ids, id]};
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(e: BeforeUnloadEvent) {
    if (this.dirty()) {
      e.preventDefault();
      e.returnValue = '';
    }
  }

  flavorsLabel(it: OrderItem): string {
    if (!it.flavors?.length) return '—';
    return [...it.flavors]
      .sort((a, b) => a.position - b.position)
      .map(f => f.stock_item?.name ?? '?')
      .join(' + ');
  }

  // ── status / actions ───────────────────────────────────────────────────────
  canMarkPaid(o: Order) {
    if (o.paid_at) return false;
    return orderIsDelivered(o) ? canMarkPaidDelivered(o) : canMarkPaidUndelivered(o);
  }

  canMarkDeliveredOrder(o: Order) {
    return canMarkDelivered(o);
  }

  canTerminate(o: Order) {
    return ['created', 'paid'].includes(o.status);
  }

  async markPaid(o: Order) {
    try {
      await firstValueFrom(this._service.markOrderPaid(o.id, {payment_method: 'cash', payment_data: {}}));
      this._notif.success('Marked as paid');
      this.stored.reload();
    } catch {
      this._notif.error('Failed to mark paid');
    }
  }

  async markDelivered(o: Order) {
    try {
      await firstValueFrom(this._service.markOrderDelivered(o.id));
      this._notif.success('Marked as delivered');
      this.stored.reload();
    } catch {
      this._notif.error('Failed to mark delivered');
    }
  }

  async setStatus(status: 'cancelled' | 'returned') {
    if (!this.uuid()) return;
    try {
      await firstValueFrom(this._service.updateOrder(this.uuid()!, {status}));
      this._notif.success('Status updated');
      this.stored.reload();
    } catch {
      this._notif.error('Failed to update status');
    }
  }

  // ── save customer / delivery ──────────────────────────────────────────────
  async saveCustomer() {
    if (!this.uuid()) return;
    const c = this.customerForm();
    const dto: AdminUpdateOrderDto = {
      customer: {
        name: c.name.trim(),
        email: c.email.trim() || null,
        phone_number: c.phone_number.trim() || null,
        telegram: c.telegram.trim() || null,
        whatsapp: c.whatsapp.trim() || null,
      },
    };
    try {
      await firstValueFrom(this._service.updateOrder(this.uuid()!, dto));
      this._notif.success('Customer updated');
      this.stored.reload();
    } catch {
      this._notif.error('Failed to update customer');
    }
  }

  async saveDelivery() {
    if (!this.uuid()) return;
    const d = this.deliveryForm();
    const dto: AdminUpdateOrderDto = {
      delivery_type: d.delivery_type,
      delivery_date: d.delivery_date ? d.delivery_date.toISOString() : null,
      delivery_time: d.delivery_time.trim() || null,
      delivery_info: d.delivery_type === 'delivery' && d.address.trim()
        ? {address: d.address.trim()}
        : null,
      comment: d.comment.trim() || null,
    };
    try {
      await firstValueFrom(this._service.updateOrder(this.uuid()!, dto));
      this._notif.success('Delivery updated');
      this.stored.reload();
    } catch {
      this._notif.error('Failed to update delivery');
    }
  }

  // ── items ──────────────────────────────────────────────────────────────────
  async saveQty(orderId: string, it: OrderItem) {
    const next = this.itemQtyEdits()[it.id];
    if (!next || next === it.quantity) return;
    try {
      await firstValueFrom(this._service.updateItem(orderId, it.id, {quantity: next}));
      this._notif.success('Quantity updated');
      this.stored.reload();
    } catch {
      this._notif.error('Failed to update quantity');
    }
  }

  async removeItem(orderId: string, it: OrderItem) {
    if (!confirm('Delete this item?')) return;
    try {
      await firstValueFrom(this._service.deleteItem(orderId, it.id));
      this._notif.success('Item removed');
      this.stored.reload();
    } catch {
      this._notif.error('Failed to remove item');
    }
  }

  async addItem(orderId: string) {
    if (!this.canAdd()) return;
    const f = this.addForm();
    const dto: AdminAddItemDto = {
      stock_set_rule_id: f.rule!.id,
      flavor_ids: f.flavor_ids,
      quantity: f.quantity,
    };
    try {
      await firstValueFrom(this._service.addItem(orderId, dto));
      this._notif.success('Item added');
      this.addForm.set({set: null, rule: null, flavor_ids: [], quantity: 1});
      this.stored.reload();
    } catch (err: any) {
      this._notif.error(err?.error?.error ?? 'Failed to add item');
    }
  }
}
