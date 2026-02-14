import {Component, Input} from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
  selector: 'cm-card',
  standalone: true,
  template: `
      <div [class.center]="center"
           [class.flat]="flat"
           [ngClass]="size"
           class="card">
          <ng-content></ng-content>
      </div>
  `,
  imports: [
    NgClass
  ],
  styles: [
    `
      :host {
        display: flex;
        width: 100%;
      }

      .card {
        background-color: var(--card-bg);
        padding: 24px;
        border-radius: 32px;
        width: 100%;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .card.flat {
        padding: 0;
      }

      .card.center {
        justify-content: center;
        align-items: center;
      }

      .card.small {
        padding: 16px;
        border-radius: 16px;
      }
    `
  ]
})
export class CardComponent {
  constructor() {
  }

  @Input() flat: boolean = false;
  @Input() center: boolean = false;
  @Input() size: 'small' | 'default' | 'large' = 'default';
}
