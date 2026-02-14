import {Component, ElementRef, forwardRef, Input, input, signal, ViewChild} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'cm-readonly-control',
  standalone: true,
  template: `
    <div class="cm-readonly-control">
      <input #input
             [disabled]="true"
             [placeholder]="placeholder()"
             [readonly]="true"
             [name]="name()"
             [attr.data-u2e]="'readonly-input.' + name()"
             [value]="value"
             class="input"
             type="text">

      <div [style.display]="noAfter() ? 'none' : 'flex'"
           class="cm-readonly-control__after">
        <ng-content select="after"></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        user-select: none;
        width: 100%;
      }

      .cm-readonly-control {
        width: 100%;
        display: flex;
        border-radius: 12px;
        gap: 16px;
        position: relative;
        opacity: 0.99;
        border: 1px solid var(--control-bg);

        &::after {
          content: '';
          position: absolute;
          z-index: -1;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: var(--control-bg);
          border-radius: 12px;
          opacity: 0.4;
        }
      }

      .cm-readonly-control__after {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 0 16px;
        white-space: nowrap;
        flex: 0 0 auto;
      }

      .input {
        border: none;
        padding: 15px;
        border-radius: 12px;
        font-family: inherit;
        font-size: inherit;
        background-color: transparent;
        width: 100%;
        pointer-events: none;
        user-select: none;
      }

      .input::placeholder {
        color: var(--placeholder);
      }

      .input:focus {
        outline: none;
        box-shadow: var(--focus-shadow);
      }
    `
  ],
  imports: [
    FormsModule,
  ],
   providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ReadonlyControlComponent),
      multi: true
    }
  ]
})

export class ReadonlyControlComponent
  implements ControlValueAccessor {
  constructor() {}

  @ViewChild('input', {static: true}) input: ElementRef<HTMLInputElement> | undefined;
  @Input() value: string | number | null | undefined = '';
  placeholder = input('Enter text here');
  name = input('');
  noAfter = signal(false);

  focus() {
    this.input?.nativeElement.focus();
  }


  onChange: (value: string) => void = () => {
  };
  onTouched: () => void = () => {
  };

  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  ngAfterViewInit() {
    const after = this.input?.nativeElement.nextElementSibling;
    if (after?.childElementCount === 0) {
      this.noAfter.set(true);
    }
  }
}
