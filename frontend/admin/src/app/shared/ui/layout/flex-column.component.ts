import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
  selector: 'cm-flex-column',
  standalone: true,
  template: `
    <div [class.expand-mobile]="expandMobile"
         [class.fill]="fill"
         [ngClass]="size"
         [style.align-items]="alignItems"
         class="gap-column">
      <ng-content></ng-content>
    </div>
  `,
  imports: [
    NgClass
  ],
  styles: [
    `:host {

      flex: 1;
      @media (max-width: 768px) {
        width: 100%;
      }
    }

    .gap-column {
      display: flex;
      flex-direction: column;
      gap: 32px;
    }

    .gap-column.small {
      gap: 8px;
    }

    .gap-column.medium {
      gap: 16px;
    }

    .gap-column.tiny {
      gap: 4px;
    }

    .gap-column.fill {
      justify-content: space-between;
      height: 100%;
    }

    @media (max-width:768px) {
      .gap-column {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .gap-column.small {
        gap: 4px;
      }

      .gap-column.medium {
        gap: 8px;
      }

      .gap-column.tiny {
        gap: 2px;
      }
    }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlexColumnComponent {
  constructor() {
  }

  @Input() fill: boolean = false;
  @Input() expandMobile: boolean = false;
  @Input() size: 'default' |
    'small' |
    'medium' |
    'tiny'
    = 'default';
  @Input() position:
    'start' |
    'center' |
    'end' |
    'stretch'
    = 'stretch';

  get alignItems() {
    const position = this.position;
    if (position === 'start') {
      return 'flex-start';
    } else if (position === 'center') {
      return 'center';
    } else if (position === 'end') {
      return 'flex-end';
    } else {
      return 'stretch';
    }
  }
}
