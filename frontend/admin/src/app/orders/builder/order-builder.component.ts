import {Component, effect, inject, resource, signal} from '@angular/core';
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
  items: {
    stock_item_id: string
    quantity: number
  }[]
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

        <form (submit)="onSubmit($event)"
              novalidate>
          <cm-flex-column>
            <cm-flex-column size="small">
              <cm-title [level]="4">
                Delivery info
              </cm-title>

              <cm-control label="Delivery date">
                <cm-flex-row size="small"
                             cmExpand
                             [equal]="true">
                  <cm-date-picker [formField]="orderForm.delivery_date"></cm-date-picker>
                  <cm-time-picker [formField]="orderForm.delivery_date"></cm-time-picker>
                </cm-flex-row>
              </cm-control>

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

            <cm-multiselect [autoLoad]="true"
                            resource="products">
              <ng-template cmControlTpl
                           type="label"
                           let-item>
                @let stopped = item.status === 'stopped';
                @let archived = item.status === 'archived';

                @if (stopped) {
                  <span style="color: orange">
                    [Stopped]
                  </span>
                }
                @if (archived) {
                  <span style="color: gray">
                    [Archived]
                  </span>
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
                  <span style="color: orange">
                    [Stopped]
                  </span>
                }
                @if (archived) {
                  <span style="color: gray">
                    [Archived]
                  </span>
                }
                {{ item.name }}
                - {{ item.price }}$ ({{ item.cost_price }}$ cost)
              </ng-template>
            </cm-multiselect>

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
    ControlTemplateDirective
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
    }
  });
  readonly orderForm = form(
    this.orderModel,
    (path) => {
      required(path.delivery_date, {message: 'Delivery date is required'});
      required(path.delivery_info.postalCode, {message: 'Postal code is required'});
      required(path.delivery_info.addressLine1, {message: 'Address line 1 is required'});
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
  readonly storedEffect = effect(() => {
    const value = this.stored.value();
    if (value) {
      this.orderModel.set({
        items: value.items.map(item => ({
          stock_item_id: item.stock_item_id,
          quantity: item.quantity
        })),
        delivery_date: value.delivery_date,
        delivery_info: value.delivery_info,
        comment: value.comment,
        discount_amount: value.discount_amount,
        payment_data: value.payment_data,
        payment_method: value.payment_method,
        completed_at: value.completed_at,
        paid_at: value.paid_at,
        customer: value.customer,
      });
    }
  })
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
  private readonly _notificationsService = inject(NotificationsService);

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

  private _getModelValue() {
    const model = this.orderModel();
    return {
      items: model.items,
      delivery_date: model.delivery_date,
      delivery_info: model.delivery_info,
      comment: model.comment,
      discount_amount: model.discount_amount,
      payment_data: model.payment_data,
      payment_method: model.payment_method,
      completed_at: model.completed_at,
      paid_at: model.paid_at,
      customer: model.customer,
    }
  }
}
