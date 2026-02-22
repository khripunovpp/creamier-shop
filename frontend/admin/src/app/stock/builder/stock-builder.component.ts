import {Component, inject, signal} from '@angular/core';
import {form, FormField, required} from '@angular/forms/signals';
import {FlexColumnComponent} from '../../shared/ui/layout/flex-column.component';
import {FlexRowComponent} from '../../shared/ui/layout/flex-row.component';
import {TitleComponent} from '../../shared/ui/layout/title.component';
import {BackLinkComponent} from '../../shared/ui/back-link.component';
import {InputComponent} from '../../shared/ui/controls/input.component';
import {NumberInputComponent} from '../../shared/ui/controls/number-input.component';
import {ControlComponent} from '../../shared/ui/controls/control-item/control.component';
import {ButtonComponent} from '../../shared/ui/controls/button/button.component';
import {StockService} from '../stock.service';
import {finalize} from 'rxjs';
import {NotificationsService} from '../../shared/services/notifications.service';
import {ContainerComponent} from '../../shared/ui/layout/container.component';
import {InlineCircleLoaderComponent} from '../../shared/ui/inline-circle-loader.component';

export interface StockItemModel {
  name: string
  description: string
  price: number
  quantity: number
  cost_price: number
}

@Component({
  selector: 'cm-stock-builder',
  host: {
    class: 'cm-host-expanded'
  },
  template: `
    <cm-container>
      <cm-flex-column>
        <cm-flex-row size="small" [center]="true">
          <cm-back-link [segments]="['/stock']"></cm-back-link>
          <cm-title>New Stock Item</cm-title>

          <!--        @if (stock.isLoading()) {-->
          <!--          <cm-inline-circle-loader></cm-inline-circle-loader>-->
          <!--        }-->
        </cm-flex-row>

        <form (submit)="onSubmit($event)"
              novalidate>
          <cm-flex-column>
            <cm-control label="Name">
              <cm-input placeholder=""
                        [formField]="stockItemForm.name"></cm-input>
            </cm-control>
            <cm-control label="Description">
              <cm-input placeholder=""
                        [formField]="stockItemForm.description"></cm-input>
            </cm-control>

            <cm-flex-row size="small"
                         [equal]="true">
              <cm-control label="Price">
                <cm-number-input placeholder=""
                                 [formField]="stockItemForm.price"></cm-number-input>
              </cm-control>

              <cm-control label="Cost Price">
                <cm-number-input placeholder=""
                                 [formField]="stockItemForm.cost_price"></cm-number-input>
              </cm-control>

              <cm-control label="Quantity">
                <cm-number-input placeholder=""
                                 [formField]="stockItemForm.quantity"></cm-number-input>
              </cm-control>
            </cm-flex-row>

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
    InputComponent,
    FormField,
    NumberInputComponent,
    ControlComponent,
    ButtonComponent,
    ContainerComponent,
    InlineCircleLoaderComponent
  ],
  styles: `
    :host {
      --control-bg: #fff;
    }
  `
})
export class StockBuilderComponent {
  constructor() {
  }

  readonly stockItemModel = signal<StockItemModel>({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    cost_price: 0
  });
  readonly stockItemForm = form(
    this.stockItemModel,
    (path) => {
      required(path.name);
      required(path.description);
      required(path.price);
      required(path.quantity);
      required(path.cost_price);
    }
  );
  readonly loading = signal(false);
  private readonly _stockService = inject(StockService);
  private readonly _notificationsService = inject(NotificationsService);

  private _getModelValue() {
    const model = this.stockItemModel();
    return {
      name: model.name,
      description: model.description,
      price: +model.price,
      quantity: +model.quantity,
      cost_price: +model.cost_price
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.stockItemForm().invalid()) {
      this._notificationsService.warning('Please fill in all required fields correctly.');
      return;
    }
    this.loading.set(true);
    this._stockService.createProduct(this._getModelValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (item) => {
          this._notificationsService.success('Stock item created successfully.');
          this.stockItemForm().reset({
            name: '',
            description: '',
            price: 0,
            quantity: 0,
            cost_price: 0
          });
        },
        error: (error) => {
          this._notificationsService.error('Failed to create stock item. Please try again.');
          console.error('Error creating stock item:', error);
        },
      })
  }
}
