import {
  AfterViewInit,
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
import {ControlExtraTemplateDirective} from './control-extra-template.directive';
import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'cm-input',
  standalone: true,
  template: `
    <div [class.contrast]="theme() === 'contrast'"
         [class]="['cm-input--'+size()]"
         class="cm-input">
      @if (beforeExtraTpl()?.templateRef) {
        <div class="cm-input__before">
          <ng-container *ngTemplateOutlet="beforeExtraTpl()!.templateRef"></ng-container>
        </div>
      }

      <input #input
             (blur)="focused.set(false)"
             (change)="onInputChanged.emit(value)"
             (focus)="focused.set(true)"
             (input)="onChangeInput($event)"
             (keydown.enter)="onEnter.emit(value)"
             [disabled]="disable()"
             [placeholder]="placeholder()"
             [type]="inputType()"
             [value]="value"
             [name]="name()"
             [attr.data-u2e]="'input.' + name()"
             class="input">

      @if (value && !disable()) {
        <button class="cm-input__clear"
                (click)="clear()"
                type="button">
          ×
        </button>
      }

      @if (afterExtraTpl()?.templateRef) {
        <div class="cm-input__after">
          <ng-container *ngTemplateOutlet="afterExtraTpl()!.templateRef"></ng-container>
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

      .cm-input {
        display: flex;
        flex: 1;
        background-color: var(--control-bg);
        border-radius: 12px;
        gap: 16px;
      }

      .cm-input--small .input {
        padding: 12px;
        border-radius: 8px;
        font-size: 14px;
      }

      .cm-input__after {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 0 16px;
        white-space: nowrap;
        flex: 0 0 auto;
      }

      .cm-input__before {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 0 16px;
        white-space: nowrap;
        flex: 0 0 auto;
      }

      .cm-input__clear {
        color: #999;
        font-size: 18px;
        line-height: 1;
        font-family: inherit;
        padding: 0;
        border: none;
        appearance: none;
        background-color: transparent;
        margin-right: 16px;
      }

      .input {
        flex: 1;
        border: none;
        padding: 16px;
        border-radius: 12px;
        font-family: inherit;
        font-size: inherit;
        background-color: transparent;
        width: 100%;
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
    NgTemplateOutlet,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})

export class InputComponent
  implements ControlValueAccessor, AfterViewInit {
  constructor() {
  }

  @ViewChild('input', {static: true}) input: ElementRef<HTMLInputElement> | undefined;
  value: string = '';
  focused = signal<boolean>(false);
  placeholder = input('');
  autoFocus = input(false);
  inputType = input<string>('text');
  name = input<string>('');
  disable = input(false);
  onInputChanged = output<string>();
  onEnter = output<string>();
  theme = input<
    'default' | 'contrast'
  >('default');
  size = input<
    'normal' | 'small'
  >('normal');
  noAfter = signal(false);
  extraTpl = contentChildren(ControlExtraTemplateDirective, {descendants: true});
  afterExtraTpl = computed(() => {
    return this.extraTpl().find(tpl => tpl.place() === 'after');
  });
  beforeExtraTpl = computed(() => {
    return this.extraTpl().find(tpl => tpl.place() === 'before');
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
    if (this.autoFocus()) {
      this.focus();
    }
  }

  private _change(value: string) {
    this.value = String(value || '').trim();
    this.onChange(this.value);
  }

  clear() {
    this._change('');
    this.focus();
  }
}
