import {
  Component,
  computed,
  contentChildren,
  ElementRef,
  forwardRef,
  HostBinding,
  input,
  output,
  signal,
  ViewChild
} from '@angular/core';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';
import {
  removeAllNonMathSymbols

} from '../../../shared/helpers/strings.helper';
import {ControlExtraTemplateDirective} from './control-extra-template.directive';
import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'cm-number-input',
  standalone: true,
  template: `
    <div [class.disabled]="disable()"
         [class.centred]="centred()"
         [class.moveBeforeAbove]="moveBeforeAbove()"
         class="cm-number-input">

      @if (topExtraTpl()?.templateRef) {
        <div class="cm-number-input__top">
          <ng-container *ngTemplateOutlet="topExtraTpl()!.templateRef"></ng-container>
        </div>
      }


      <div class="cm-number-input__body">
        @if (beforeExtraTpl()?.templateRef) {
          <div class="cm-number-input__before">
            <ng-container *ngTemplateOutlet="beforeExtraTpl()!.templateRef"></ng-container>
          </div>
        }

        <input #input
               (blur)="focused.set(false)"
               (change)="onInputChange.emit(value)"
               (focus)="focused.set(true)"
               (input)="onChangeInput($event)"
               [name]="name()"
               [attr.data-u2e]="'number-input.' + name()"
               (keydown)="onKeydown.emit()"
               [disabled]="disable()"
               [placeholder]="placeholder()"
               [value]="value"
               class="input"
               inputmode="decimal"
               type="text">

        @if (afterExtraTpl()?.templateRef) {
          <div class="cm-number-input__after">
            <ng-container *ngTemplateOutlet="afterExtraTpl()!.templateRef"></ng-container>
          </div>
        }
      </div>

      @if (bottomExtraTpl()?.templateRef) {
        <div class="cm-number-input__bottom">
          <ng-container *ngTemplateOutlet="bottomExtraTpl()!.templateRef"></ng-container>
        </div>
      }
    </div>

  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;

        &.focused {
          box-shadow: var(--focus-shadow);
          border-radius: 12px;
        }
      }


      .cm-number-input__after {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 0 8px 0 0;
      }

      .cm-number-input.moveBeforeAbove {
        flex-wrap: wrap;
      }

      .cm-number-input.centred .input {
        text-align: center;
      }

      .cm-number-input.moveBeforeAbove .cm-number-input__before {
        width: 100%;
        padding-right: 16px;
      }

      .cm-number-input__before {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 0 0 0 8px;
      }

      .cm-number-input__top,
      .cm-number-input__bottom {
        width: 100%;
        padding: 8px;
      }

      .cm-number-input {
        display: flex;
        flex: 1;
        flex-direction: column;
        background-color: var(--control-bg);
        border-radius: 12px;
        padding: 8px;
      }

      .cm-number-input__body {

        display: flex;
        flex: 1;
        flex-wrap: wrap;
      }

      .cm-number-input.disabled {
        opacity: 0.7;
      }

      .input {
        flex: 1;
        border: none;
        padding: 8px;
        font-family: inherit;
        font-size: inherit;
        background-color: transparent;
        border-radius: 12px;
        width: 100%;
        appearance: none;
      }

      .input::placeholder {
        color: var(--placeholder);
      }

      .input:focus {
        outline: none;
      }
    `
  ],
  imports: [
    FormsModule,
    NgTemplateOutlet
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => NumberInputComponent),
      multi: true
    }
  ]
})

export class NumberInputComponent
  implements ControlValueAccessor {
  constructor() {
  }

  @ViewChild('input', {static: true}) input: ElementRef<HTMLInputElement> | undefined;
  value: string = '';
  onInputChange = output<string>();
  onKeydown = output();
  placeholder = input('Enter text here');
  name = input('');
  disable = input<boolean>(false);
  centred = input<boolean>(false);
  moveBeforeAbove = input<boolean>(false);
  focused = signal<boolean>(false);
  extraTpl = contentChildren(ControlExtraTemplateDirective, {descendants: true});
  afterExtraTpl = computed(() => {
    return this.extraTpl().find(tpl => tpl.place() === 'after');
  });
  beforeExtraTpl = computed(() => {
    return this.extraTpl().find(tpl => tpl.place() === 'before');
  });
  topExtraTpl = computed(() => {
    return this.extraTpl().find(tpl => tpl.place() === 'top');
  });
  bottomExtraTpl = computed(() => {
    return this.extraTpl().find(tpl => tpl.place() === 'bottom');
  });

  @HostBinding('class.focused') get focusedClass() {
    return this.focused();
  }

  onChange: (value: string) => void = () => {
  };

  onTouched: () => void = () => {
  };

  writeValue(value: string): void {
    this._change(value);
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  onChangeInput(
    event: Event
  ) {
    this._change((event.target as HTMLInputElement).value);
  }

  focus() {
    this.input?.nativeElement.focus();
  }

  ngAfterViewInit() {
  }

  private _change(value: string) {
    this.value = value ? removeAllNonMathSymbols(value) : '';
    if (this.input?.nativeElement) {
      this.input.nativeElement.value = this.value;
    }
    this.onChange(this.value);
  }
}
