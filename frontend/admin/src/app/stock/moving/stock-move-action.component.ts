import {Component, inject, output, signal, viewChild} from '@angular/core';
import {FlexColumnComponent} from '../../shared/ui/layout/flex-column.component';
import {DialogComponent} from '../../shared/ui/dialogs/dialog.component';
import {form, FormField, required} from '@angular/forms/signals';
import {ControlComponent} from '../../shared/ui/controls/control-item/control.component';
import {NumberInputComponent} from '../../shared/ui/controls/number-input.component';
import {finalize} from 'rxjs';
import {NotificationsService} from '../../shared/services/notifications.service';
import {StockItem, StockService} from '../stock.service';
import {RadioComponent} from '../../shared/ui/controls/radio.component';
import {FlexRowComponent} from '../../shared/ui/layout/flex-row.component';

export interface StockMoveModel {
  quantity: number
  operation: 'add' | 'remove'
  uuid: string
}

@Component({
  selector: 'cm-stock-move-action',
  template: `
    <cm-dialog (onConfirm)="onSubmit()"
               [closeOnConfirm]="false">
      <form novalidate>
        <cm-flex-column>
          <cm-control label="Operation" style="--control-bg: var(--p-1);">
            <cm-flex-row>
              <cm-radio size="small"
                        [markOnHover]="true"
                        payload="add"
                        [formField]="stockItemForm.operation">
                Add
              </cm-radio>

              <cm-radio size="small"
                        [markOnHover]="true"
                        payload="remove"
                        [formField]="stockItemForm.operation">
                Remove
              </cm-radio>
            </cm-flex-row>
          </cm-control>

          <cm-control label="Quantity">
            <cm-number-input placeholder=""
                             [formField]="stockItemForm.quantity"></cm-number-input>
          </cm-control>
        </cm-flex-column>
      </form>
    </cm-dialog>
  `,
  imports: [
    FlexColumnComponent,
    DialogComponent,
    ControlComponent,
    NumberInputComponent,
    FormField,
    RadioComponent,
    FlexRowComponent
  ],
  styles: `
    :host {
    }
  `
})
export class StockMoveActionComponent {
  constructor() {
  }

  readonly dialog = viewChild(DialogComponent);
  readonly stockItemModel = signal<StockMoveModel>({
    quantity: 0,
    operation: 'add',
    uuid: '',
  });
  readonly stockItemForm = form(
    this.stockItemModel,
    (path) => {
      required(path.quantity);
      required(path.operation);
      required(path.uuid);
    }
  );
  readonly loading = signal(false);
  readonly onConfirm = output<void>();
  private readonly _stockService = inject(StockService);
  private readonly _notificationsService = inject(NotificationsService);

  onSubmit() {
    if (this.stockItemForm().invalid()) {
      this._notificationsService.warning('Please fill in all required fields correctly.');
      return;
    }
    this.loading.set(true);
    console.log('Submitting stock move:', this.stockItemModel());

    this._stockService.moveStockItem(this.stockItemModel()).pipe(
      finalize(() => this.loading.set(false)),
    ).subscribe({
      next: () => {
        this._notificationsService.success('Stock item updated successfully.');
        this.onConfirm.emit();
        this.stockItemForm().reset({
          quantity: 0,
          operation: this.stockItemModel().operation,
          uuid: this.stockItemModel().uuid,
        });
        this.close();
      },
      error: (error) => {
        this._notificationsService.error('Failed to update stock item. Please try again.');
        console.error('Error updating stock item:', error);
      },
    })
  }

  open(
    item: StockItem,
  ) {
    this.stockItemModel.set({
      quantity: 0,
      operation: 'add',
      uuid: item.id,
    });
    this.dialog()?.open();
  }

  close() {
    this.dialog()?.close();
  }
}
