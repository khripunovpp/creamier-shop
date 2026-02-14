import {Component, ElementRef, input, ViewChild} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';

@Component({
  selector: 'cm-textarea',
  host: {
    '[class.readonly]': 'readOnly()'
  },
  template: `
    <textarea #input
              (input)="onChangeInput($event)"
              [attr.rows]="rows()"
              [attr.maxlength]="maxlength() || null"
              [placeholder]="placeholder()"
              [readonly]="readOnly()"
              [value]="value"
              class="textarea"
    ></textarea>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        position: relative;
        opacity: 0.99;
      }

      .textarea {

        flex: 1;
        border: none;
        border-radius: 12px;
        padding: 16px;
        background-color: var(--control-bg);
        font-family: inherit;
        font-size: inherit;
      }

      .textarea::placeholder {
        color: var(--placeholder);
      }

      .textarea:focus {
        outline: none;
        box-shadow: var(--focus-shadow);
      }

      .textarea[readonly] {
        background-color: transparent;
        border: 1px solid var(--control-bg);
      }

      :host.readonly::after {
        content: "";
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
    `
  ],
  imports: [
    FormsModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: TextareaComponent,
      multi: true
    }
  ]
})

export class TextareaComponent
  implements ControlValueAccessor {
  constructor() {
  }

  rows = input<number>(5);
  @ViewChild('input', {static: true}) input: ElementRef<HTMLInputElement> | undefined;
  value: string = '';
  placeholder = input('Enter text here');
  readOnly = input<boolean>(false);
  maxlength = input<number | null>(null);

  onChange: (value: string) => void = () => {
  };

  onTouched: () => void = () => {
  };

  writeValue(value: string): void {
    this.changeValue(value);
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  focus() {
    this.input?.nativeElement.focus();
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  changeValue(value: string): void {
    this.value = String(value || '').trim();
    this.onChange(this.value);
  }

  onChangeInput(
    event: Event
  ) {
    this.changeValue((event.target as HTMLInputElement).value);
  }
}
