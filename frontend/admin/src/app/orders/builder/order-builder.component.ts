import {Component, computed, effect, inject, resource, signal} from '@angular/core';
import {form, FormField, required, validate} from '@angular/forms/signals';
import {FlexColumnComponent} from '../../shared/ui/layout/flex-column.component';
import {FlexRowComponent} from '../../shared/ui/layout/flex-row.component';
import {TitleComponent} from '../../shared/ui/layout/title.component';
import {BackLinkComponent} from '../../shared/ui/back-link.component';
import {finalize, firstValueFrom} from 'rxjs';
import {NotificationsService} from '../../shared/services/notifications.service';
import {ContainerComponent} from '../../shared/ui/layout/container.component';
import {InlineCircleLoaderComponent} from '../../shared/ui/inline-circle-loader.component';
import {injectParams} from '../../shared/helpers/route.helpers';
import {Order, OrdersService} from '../orders.service';
import {ControlComponent} from '../../shared/ui/controls/control-item/control.component';
import {ButtonComponent} from '../../shared/ui/controls/button/button.component';
import {DatePickerComponent} from '../../shared/ui/controls/date-picker.component';
import {TimePickerComponent} from '../../shared/ui/controls/time-picker.component';
import {ExpandDirective} from '../../shared/directives/expand.directive';
import {InputComponent} from '../../shared/ui/controls/input.component';
import {RadioComponent} from '../../shared/ui/controls/radio.component';
import {TextareaComponent} from '../../shared/ui/controls/textarea.component';
import {MultiselectComponent} from '../../shared/ui/controls/multiselect.component';
import {ControlTemplateDirective} from '../../shared/ui/controls/control-template.directive';
import {NumberInputComponent} from '../../shared/ui/controls/number-input.component';
import {WidthDirective} from '../../shared/directives/width.directive';

type OrderFrontOnlyFields = {
  items: {
    sum: number
  }[]
}

export type OrderModel = Omit<Order,
  'id'
  | 'user_id'
  | 'created_at'
  | 'status'
  | 'profit_amount'
  | 'total_amount'
  | 'items'
  | 'customer'
> & {
  items: Array<{
    stock_item_id: string
    quantity: number
    price: number
  } & OrderFrontOnlyFields['items'][number]>
  customer: {
    name: string
    email: string
    phone_number: string | null
    telegram: string | null
    whatsapp: string | null
  }
}


@Component({
  selector: 'cm-order-builder',
  host: {
    class: 'cm-host-expanded'
  },
  template: `
    <cm-container>
      <cm-flex-column>
        <cm-flex-row size="small" [center]="true">
          <cm-back-link [segments]="['/orders']"></cm-back-link>
          <cm-title>
            @if (uuid()) {
              Edit order
            } @else {
              Create order
            }
          </cm-title>

          @if (stored.isLoading()) {
            <cm-inline-circle-loader></cm-inline-circle-loader>
          }
        </cm-flex-row>

        @if (stored.error()) {
          <cm-control>
            Failed to load order data. Please try again later.
          </cm-control>
        } @else {
          <form (submit)="onSubmit($event)"
                novalidate>
            <cm-flex-column>
              <cm-flex-column size="small">
                <cm-title [level]="4">
                  Delivery info
                </cm-title>

                <cm-control label="Comment">
                  <cm-textarea [formField]="orderForm.comment"></cm-textarea>
                </cm-control>

                <cm-flex-row>
                  <cm-radio size="small"
                            [markOnHover]="true"
                            payload="pickup"
                            [formField]="orderForm.delivery_type">
                    Pickup
                  </cm-radio>

                  <cm-radio size="small"
                            [markOnHover]="true"
                            payload="shipping"
                            [formField]="orderForm.delivery_type">
                    Shipping
                  </cm-radio>
                </cm-flex-row>

                <cm-control label="Delivery date">
                  <cm-flex-row size="small"
                               cmExpand
                               [equal]="true">
                    <cm-date-picker [formField]="orderForm.delivery_date"></cm-date-picker>
                    <cm-time-picker [formField]="orderForm.delivery_date"></cm-time-picker>
                  </cm-flex-row>
                </cm-control>

                @if (!isPickup()) {
                  <cm-flex-row size="small"
                               cmExpand
                               [equal]="true">
                    <cm-control label="Postal code">
                      <cm-input [formField]="orderForm.delivery_info.postalCode"></cm-input>
                    </cm-control>

                    <cm-control label="Address line 1">
                      <cm-input [formField]="orderForm.delivery_info.addressLine1"></cm-input>
                    </cm-control>

                    <cm-control label="Address line 2">
                      <cm-input [formField]="orderForm.delivery_info.addressLine2"></cm-input>
                    </cm-control>
                  </cm-flex-row>
                }
              </cm-flex-column>

              <cm-flex-column size="small">
                <cm-title [level]="4">
                  Order items
                </cm-title>

                @if (orderForm.items.length) {
                  <cm-flex-row size="small"
                               [center]="true">
                    <div cmExpand>
                      Product
                    </div>
                    <div cmWidth="15%">
                      Quantity
                    </div>
                    <div cmWidth="1%">x</div>
                    <div cmWidth="15%">
                      Price
                    </div>
                    <div cmWidth="1%">=</div>
                    <div cmWidth="15%">
                      Sum
                    </div>
                  </cm-flex-row>
                } @else {
                  <div>No items has chosen, it's strange</div>
                }

                @for (item of orderForm.items; track item.stock_item_id; let i = $index) {
                  <cm-flex-row size="small"
                               [center]="true">
                    <cm-multiselect [autoLoad]="true"
                                    cmExpand
                                    compareField="id"
                                    [formField]="item.stock_item_id"
                                    resource="products">
                      <ng-template cmControlTpl
                                   type="label"
                                   let-item>
                        @let stopped = item.status === 'stopped';
                        @let archived = item.status === 'archived';

                        @if (stopped) {
                          <span style="color: orange">[Stopped]</span>
                        }
                        @if (archived) {
                          <span style="color: gray">[Archived]</span>
                        }
                        {{ item.name }}
                        - {{ item.price }}$ ({{ item.cost_price }}$ cost)
                      </ng-template>

                      <ng-template cmControlTpl
                                   type="option"
                                   let-item>
                        @let stopped = item.status === 'stopped';
                        @let archived = item.status === 'archived';

                        @if (stopped) {
                          <span style="color: orange">[Stopped]</span>
                        }
                        @if (archived) {
                          <span style="color: gray">[Archived]</span>
                        }
                        {{ item.name }}
                        - {{ item.price }}$ ({{ item.cost_price }}$ cost)
                      </ng-template>
                    </cm-multiselect>

                    <cm-number-input cmWidth="15%"
                                     (onInputChange)="onQuantityChange(i, $event)"
                                     [formField]="item.quantity"></cm-number-input>
                    <div cmWidth="1%">x</div>
                    <span cmWidth="15%">
                      {{ item().value().price }} €
                    </span>
                    <div cmWidth="1%">=</div>
                    <span cmWidth="15%">
                      {{ item().value().sum }} €
                    </span>
                  </cm-flex-row>
                }
              </cm-flex-column>

              <cm-flex-column size="small">
                <cm-title [level]="4">
                  Payment info
                </cm-title>

                <cm-control label="Method">
                  <cm-flex-row>
                    <cm-radio size="small"
                              [markOnHover]="true"
                              payload="cash"
                              [formField]="orderForm.payment_method">
                      Cash
                    </cm-radio>

                    <cm-radio size="small"
                              [markOnHover]="true"
                              payload="bank_transfer"
                              [formField]="orderForm.payment_method">
                      Bank transfer
                    </cm-radio>
                  </cm-flex-row>
                </cm-control>

                <cm-control label="Additional data">
                  <cm-textarea [formField]="orderForm.payment_data"></cm-textarea>
                </cm-control>
              </cm-flex-column>

              <cm-flex-column size="small">
                <cm-title [level]="4">
                  Customer info
                </cm-title>
                <cm-control label="Name">
                  <cm-input [formField]="orderForm.customer.name"></cm-input>
                </cm-control>

                <cm-control label="Email">
                  <cm-input [formField]="orderForm.customer.email"></cm-input>
                </cm-control>

                <cm-control label="Phone number">
                  <cm-input [formField]="orderForm.customer.phone_number"></cm-input>
                </cm-control>

                <cm-control label="Telegram">
                  <cm-input [formField]="orderForm.customer.telegram"></cm-input>
                </cm-control>

                <cm-control label="WhatsApp">
                  <cm-input [formField]="orderForm.customer.whatsapp"></cm-input>
                </cm-control>
              </cm-flex-column>

              <cm-flex-row size="small" [center]="true">
                <cm-button type="submit">
                  Save
                </cm-button>
                @if (loading()) {
                  <cm-inline-circle-loader></cm-inline-circle-loader>
                }
              </cm-flex-row>
            </cm-flex-column>
          </form>
        }
      </cm-flex-column>
    </cm-container>
  `,
  imports: [
    FlexColumnComponent,
    FlexRowComponent,
    TitleComponent,
    BackLinkComponent,
    ContainerComponent,
    InlineCircleLoaderComponent,
    ControlComponent,
    ButtonComponent,
    DatePickerComponent,
    FormField,
    TimePickerComponent,
    ExpandDirective,
    InputComponent,
    RadioComponent,
    TextareaComponent,
    MultiselectComponent,
    ControlTemplateDirective,
    NumberInputComponent,
    WidthDirective
  ],
  styles: `
    :host {
      --control-bg: #fff;
    }
  `
})
export class OrderBuilderComponent {
  constructor() {
  }

  readonly uuid = injectParams<string>('uuid');
  readonly orderModel = signal<OrderModel>({
    items: [],
    delivery_date: null,
    delivery_info: {
      postalCode: '',
      addressLine1: '',
      addressLine2: null,
    },
    comment: null,
    discount_amount: 0,
    payment_data: '',
    payment_method: 'cash',
    completed_at: null,
    paid_at: null,
    customer: {
      name: '',
      email: '',
      phone_number: null,
      telegram: null,
      whatsapp: null,
    },
    delivery_type: 'pickup',
  });
  readonly orderForm = form(
    this.orderModel,
    (path) => {
      required(path.delivery_date, {message: 'Delivery date is required'});
      required(path.delivery_info.postalCode, {
        message: 'Postal code is required',
        when: ({valueOf}) => valueOf(path.delivery_type) === 'shipping',
      });
      required(path.delivery_info.addressLine1, {
        message: 'Address line 1 is required',
        when: ({valueOf}) => valueOf(path.delivery_type) === 'shipping',
      });
      required(path.customer.name, {message: 'Customer name is required'});
      validate(path.customer, ({value}) => {
        const customer = value();
        if (!customer.email && !customer.phone_number && !customer.telegram && !customer.whatsapp) {
          return {
            kind: 'customer_contact',
            message: 'At least one contact method (email, phone number, telegram, whatsapp) must be provided'
          };
        }
        return null;
      });
    }
  );
  readonly loading = signal(false);
  private readonly _ordersService = inject(OrdersService);
  readonly stored = resource({
    params: () => ({uuid: this.uuid()}),
    loader: ({params}) => {
      if (!params.uuid) {
        return Promise.resolve(null);
      }
      return firstValueFrom(this._ordersService.getOneOrder(params!.uuid));
    },
  });
  readonly storedEffect = effect(() => {
    const value = this.stored.value();
    if (value) {
      this.orderModel.set({
        items: value.items.map(item => ({
          stock_item_id: item.stock_item_id,
          quantity: item.quantity,
          price: item.price,
          sum: item.price * item.quantity
        })),
        delivery_date: value.delivery_date,
        delivery_info: {
          postalCode: value.delivery_info?.postalCode ?? '',
          addressLine1: value.delivery_info?.addressLine1 ?? '',
          addressLine2: value.delivery_info?.addressLine2 ?? '',
        },
        delivery_type: value.delivery_type,
        comment: value.comment ?? '',
        discount_amount: value.discount_amount,
        payment_data: value.payment_data ?? '',
        payment_method: value.payment_method,
        completed_at: value.completed_at,
        paid_at: value.paid_at,
        customer: {
          name: value.customer?.name ?? '',
          phone_number: value.customer?.phone_number ?? '',
          email: value.customer?.email ?? '',
          telegram: value.customer?.telegram ?? '',
          whatsapp: value.customer?.whatsapp ?? '',
        },
      });
    }
  });
  private readonly _notificationsService = inject(NotificationsService);
  readonly isPickup = computed(() => this.orderForm().value().delivery_type === 'pickup')

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.orderForm().invalid()) {
      const errors = this._notificationsService.parseSignalFormErrors(this.orderForm)
      this._notificationsService.error(errors.join('\n'));
      return;
    }
    this.loading.set(true);
    const request = this.uuid()
      ? this._ordersService.updateOrder(this.uuid()!, this._getModelValue())
      : this._ordersService.createOrder(this._getModelValue());

    request
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this._notificationsService.success('Order saved successfully');
        },
        error: (error) => {
          this._notificationsService.error('Failed to create order. Please try again.');
          console.error('Error creating order:', error);
        },
      })
  }

  onQuantityChange(
    index: number,
    quantity: string
  ) {
    this.orderModel.update(model => {
      const item = model.items[index];
      if (item) {
        item.quantity = parseInt(quantity, 10) || item.quantity;
        item.sum = item.price * item.quantity;
      }
      return model;
    });
  }

  private _getModelValue() {
    const model = this.orderModel();
    return {
      items: model.items.map(item => ({
        stock_item_id: item.stock_item_id,
        quantity: item.quantity,
      })),
      delivery_date: model.delivery_date,
      delivery_info: model.delivery_info,
      comment: model.comment,
      discount_amount: model.discount_amount,
      payment_data: model.payment_data,
      payment_method: model.payment_method,
      completed_at: model.completed_at,
      paid_at: model.paid_at,
      customer: model.customer,
      delivery_type: model.delivery_type,
    }
  }
}
