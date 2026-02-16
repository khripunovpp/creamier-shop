import {Component, signal} from '@angular/core';
import {form} from '@angular/forms/signals';
import {FlexColumnComponent} from '../../shared/ui/layout/flex-column.component';
import {FlexRowComponent} from '../../shared/ui/layout/flex-row.component';
import {InlineCircleLoaderComponent} from '../../shared/ui/inline-circle-loader.component';
import {TableCardComponent} from '../../shared/ui/card/table-card.component';
import {TitleComponent} from '../../shared/ui/layout/title.component';
import {BackLinkComponent} from '../../shared/ui/back-link.component';

export interface StockItemModel {
  name: string
  description: string
  price: number
  quantity: number
  cost_price: number
}

@Component({
  selector: 'cm-stock-builder',
  template: `
    <cm-flex-column>
      <cm-flex-row size="small" [center]="true">
        <cm-back-link [segments]="['/stock']"></cm-back-link>
        <cm-title>New Stock Item</cm-title>

<!--        @if (stock.isLoading()) {-->
<!--          <cm-inline-circle-loader></cm-inline-circle-loader>-->
<!--        }-->
      </cm-flex-row>
    </cm-flex-column>
  `,
  imports: [
    FlexColumnComponent,
    FlexRowComponent,
    InlineCircleLoaderComponent,
    TableCardComponent,
    TitleComponent,
    BackLinkComponent
  ],
  styles: `
    :host {
      display: block;
    }
  `
})
export class StockBuilderComponent {
  constructor() {
  }

  stockItemModel = signal<StockItemModel>({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    cost_price: 0
  });
  stockItemForm = form(this.stockItemModel, (path) => {

  });
}
