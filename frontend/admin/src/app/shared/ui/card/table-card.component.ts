import {Component, input, ViewEncapsulation} from '@angular/core';
import {CardComponent} from './card.component';

@Component({
  selector: 'cm-table-card',
  standalone: true,
  imports: [
    CardComponent,
  ],
  template: `
    <cm-card [flat]="true">
      <div [class]="['table',size()]">
        <div class="table__scroll">
          <ng-content></ng-content>
        </div>
      </div>
    </cm-card>
  `,
  styles: [
    `
      :host {
        display: flex;
        width: 100%;
      }

      .table__scroll {
        overflow-x: auto;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        --border-color: #efefef;
      }

      .table.large {
        td, thead th {
          padding: 16px 24px;
        }
      }

      table thead tr {
        border-bottom: 1px solid var(--border-color);
      }

      table thead th {
        text-align: left;
        padding: 8px 12px;
        opacity: 0.4;
        font-size: 0.8em;
      }

      table tbody tr {
        border-bottom: 1px solid var(--border-color);
      }

      table tbody tr:last-child {
        border-bottom: none;
      }

      td {
        padding: 8px 12px;
      }
    `
  ],
  encapsulation: ViewEncapsulation.None,
})
export class TableCardComponent {
  constructor() {
  }

  size = input<'small' | 'medium' | 'large'>('large');
}
