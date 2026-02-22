import {
  Component,
  forwardRef,
  HostListener,
  ViewEncapsulation,
  input
} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';
import {NgClass} from '@angular/common';

@Component({
  selector: 'cm-switch',
  standalone: true,
  template: `
    <label [attr.data-u2e]="'switch.' + name() +'.label'"
           [attr.for]="name()"
           [ngClass]="size()"
           class="cm-switch"
           tabindex="0">
      <ng-content select="[slot='left']"></ng-content>

      <input (ngModelChange)="onChangeSwitch($event)"
             [attr.data-u2e]="'switch.' + name() +'.input'"
             [attr.id]="name()"
             [attr.name]="name()"
             [ngModel]="modelValue"
             class="switch"
             type="checkbox"/>

      <span class="cm-switch__track">
        <span class="cm-switch__thumb"></span>
      </span>

      <ng-content select="[slot='right']"></ng-content>
    </label>
  `,
  styles: [`
    cm-switch {
      display: flex;
    }
    .cm-switch {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      border-radius: 9999px;
    }

    .switch {
      display: none;
    }

    .cm-switch__track {
      position: relative;
      display: inline-flex;
      align-items: center;
      width: 42px;
      height: 24px;
      background-color: var(--control-bg, #ccc);
      border-radius: 9999px;
      transition: background-color 0.2s ease-in-out;
    }

    .cm-switch__thumb {
      position: absolute;
      left: 2px;
      width: 20px;
      height: 20px;
      background-color: #fff;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      transition: transform 0.2s ease-in-out;
    }

    .switch:checked + .cm-switch__track {
      background-color: var(--control-bg-selected, #4caf50);
    }

    .switch:checked + .cm-switch__track .cm-switch__thumb {
      transform: translateX(18px);
    }

    /* sizes */
    .cm-switch.small .cm-switch__track {
      width: 28px;
      height: 16px;
    }
    .cm-switch.small .cm-switch__thumb {
      width: 12px;
      height: 12px;
      left: 2px;
    }
    .cm-switch.small .switch:checked + .cm-switch__track .cm-switch__thumb {
      transform: translateX(12px);
    }

    .cm-switch.medium .cm-switch__track {
      width: 36px;
      height: 20px;
    }
    .cm-switch.medium .cm-switch__thumb {
      width: 16px;
      height: 16px;
      left: 2px;
    }
    .cm-switch.medium .switch:checked + .cm-switch__track .cm-switch__thumb {
      transform: translateX(16px);
    }
  `],
  encapsulation: ViewEncapsulation.None,
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SwitchComponent),
    multi: true
  }],
  imports: [
    FormsModule,
    NgClass
  ]
})
export class SwitchComponent implements ControlValueAccessor {
  value = input<string | number>('');
  name = input<string>('cm-switch');
  size = input<'small' | 'medium' | 'default'>('default');

  modelValue = false;

  @HostListener('keydown.enter', ['$event'])
  @HostListener('keydown.space', ['$event'])
  onKeydown(event: Event) {
    event.preventDefault();
    this.onChangeSwitch(!this.modelValue);
  }

  onChange: (value: boolean) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: boolean): void {
    this._change(value);
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  onChangeSwitch(value: boolean) {
    this._change(value);
  }

  private _change(value: boolean) {
    this.modelValue = value;
    this.onChange(this.modelValue);
  }
}
