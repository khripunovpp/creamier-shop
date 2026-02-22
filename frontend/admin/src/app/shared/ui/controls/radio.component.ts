import {Component, input, model, ViewEncapsulation} from '@angular/core';
import {FormValueControl} from '@angular/forms/signals';

@Component({
  selector: 'cm-radio',
  standalone: true,
  template: `
    <label [attr.for]="name()+'-'+payload()"
           [class]="size()"
           [attr.data-u2e]="'radio.' + name() + '.label.' + payload()"
           class="cm-radio"
           tabindex="0">
      <input (change)="value.set(payload())"
             [attr.data-u2e]="'radio.' + name() + '.input.' + payload()"
             [attr.id]="name()+'-'+payload()"
             [checked]="value() === payload()"
             type="radio"
             class="radio">
      <div [class.cm-radio__hoverOnly]="markOnHover()"
           class="cm-radio__mark">
        <div class="cm-radio__mark-inner">
          @if (!noMark()) {
            @if (customMark()) {
              <div [innerHTML]="customMark()"></div>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                   viewBox="0 0 24 24">
                <path fill="currentColor"
                      d="M9.5 16.5l-4.25-4.25 1.4-1.4L9.5 13.7l7.35-7.35 1.4 1.4z"/>
              </svg>
            }
          }
        </div>
      </div>

      <ng-content></ng-content>
    </label>
  `,
  styles: [
    `
      .cm-radio {
        display: flex;
        align-items: center;
        border-radius: 12px;
        gap: 8px;
      }

      .cm-radio:focus-within {
        outline-color: var(--active-color);
      }

      .cm-radio__mark {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 51px;
        height: 51px;
        border-radius: 12px;
        background-color: var(--control-bg);
        opacity: 0.2;
        cursor: pointer;
        transition: all 0.2s ease-in-out;
        border: 1px solid transparent;

        &-inner {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .cm-radio__hoverOnly {
        background-color: transparent;
        border-color: var(--text-color);
      }

      .cm-radio__hoverOnly .cm-radio__mark-inner {
        opacity: 0;
        transition: all 0.2s ease-in-out;
      }

      @media (hover: hover) {
        .cm-radio__mark:hover {
          opacity: 1;
        }

        .cm-radio__hoverOnly:hover .cm-radio__mark-inner {
          opacity: 1;
        }
      }

      .radio {
        display: none;
      }

      .radio:checked + .cm-radio__mark {
        background-color: var(--control-bg-selected);
        opacity: 1;
        font-weight: 700;
      }

      .radio:checked + .cm-radio__hoverOnly {

        border-color: var(--control-bg-selected);
      }

      .radio:checked + .cm-radio__hoverOnly .cm-radio__mark-inner {
        opacity: 1;

      }

      .cm-radio.small .cm-radio__mark {
        width: 16px;
        height: 16px;
        border-radius: 6px;

        svg {
          width: 16px;
          height: 16px;
        }
      }
    `
  ],
  encapsulation: ViewEncapsulation.None,
  imports: []
})
export class RadioComponent
  implements FormValueControl<string> {
  constructor() {
  }

  customMark = input<string>('');
  name = input<string>('');
  value = model<string>('');
  payload = input<string>('');
  size = input<
    'small' | 'default' | 'large'
  >('default');
  markOnHover = input<boolean>(false);
  noMark = input<boolean>(false);
}
