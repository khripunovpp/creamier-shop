import {Component, Input, input, ViewEncapsulation} from '@angular/core';
import {NgClass, NgStyle} from '@angular/common';

@Component({
  selector: 'cm-flex-row',
  standalone: true,
  template: `
    <div [class.gap-row__bottom]="bottom()"
         [class.gap-row__center]="center()"
         [class.gap-row__right]="right()"
         [class.gap-row__left]="left()"
         [class.gap-row__strict-center]="strictCenter()"
         [class.gap-row__fit]="fit()"
         [class.gap-row__mobile]="mobileMode()"
         [class.gap-row__responsive]="!noResponsive()"
         [class.gap-row__relaxed]="relaxed()"
         [class.gap-row__top]="top()"
         [class.gap-row__equal]="equal"
         [class.gap-row__wrap]="wrap()"
         [class.gap-row__mobileReverse]="mobileReverse()"
         [ngClass]="size()"
         [style]="'--cols: ' + cols()"
         [ngStyle]="styles()"
         class="gap-row">
      <ng-content></ng-content>
    </div>
  `,
  imports: [
    NgClass,
    NgStyle
  ],
  styles: [
    `:host {
      flex: 1;
      --cm-gap-row-pad-left: 0;
      --cm-gap-row-pad-right: 0;
    }

    .gap-row {
      display: flex;
      --gap: 32px;
      gap: var(--gap);
      padding-left: var(--cm-gap-row-pad-left);
      padding-right: var(--cm-gap-row-pad-right);
    }


    .gap-row__center {
      align-items: center;
    }

    .gap-row__strict-center {
      align-items: center;
      justify-content: center;
    }

    .gap-row__bottom {
      align-items: flex-end;
    }

    .gap-row__top {
      align-items: flex-start;
    }

    .gap-row__right {
      justify-content: flex-end;
    }

    .gap-row__left {
      justify-content: flex-start;
    }

    .gap-row.small {
      --gap: 8px;
    }

    .gap-row.medium {
      --gap: 16px;
    }

    .gap-row.tiny {
      --gap: 4px;
    }

    .gap-row__fit > * {
      flex: auto;

    }

    .gap-row__equal {
      align-items: stretch;
    }

    .gap-row__equal > * {
      flex: 1;
    }

    .gap-row__relaxed {
      justify-content: space-between;
    }

    .gap-row__wrap {
      flex-wrap: wrap;

      & > * {
        flex: 0 0 calc((100% / var(--cols)) - (var(--gap) / var(--cols)));
      }

      &.gap-row__fit > * {
        flex: 0;
      }
    }

    @media (max-width: 768px) {
      .gap-row__responsive {
        &.gap-row__mobile {
          flex-direction: column;
          --gap: 16px;
        }

        &.gap-row__mobile.small {
          --gap: 4px;
        }

        &.gap-row__mobile.medium {
          --gap: 8px;
        }

        &.gap-row__mobile.tiny {
          --gap: 2px;
        }

        &.gap-row__mobileReverse {
          flex-direction: column-reverse;
        }
      }
    }
    `
  ],
  encapsulation: ViewEncapsulation.None,
})
export class FlexRowComponent {
  constructor() {
  }

  @Input() equal = false;
  center = input<boolean>(false);
  right = input<boolean>(false);
  left = input<boolean>(false);
  strictCenter = input<boolean>(false);
  bottom = input<boolean>(false);
  top = input<boolean>(false);
  fit = input<boolean>(false);
  mobileMode = input<boolean>(false);
  mobileReverse = input<boolean>(false);
  noResponsive = input<boolean>(false);
  relaxed = input<boolean>(false);
  wrap = input<boolean>(false);
  cols = input<string|number>(1);
  size = input<
    'default' |
    'small' |
    'medium' |
    'tiny'
  >('default');
  styles = input<NgStyle['ngStyle']>({});
}
