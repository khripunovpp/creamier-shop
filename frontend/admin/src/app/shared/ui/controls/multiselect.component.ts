import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  forwardRef,
  Input,
  input,
  OnInit,
  Optional,
  output,
  signal,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {NgLabelTemplateDirective, NgOptionTemplateDirective, NgSelectComponent} from '@ng-select/ng-select';
import {ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR} from '@angular/forms';
import {NgTemplateOutlet} from '@angular/common';
import {SelectResourcesService} from '../../services/select-resources.service';
import {ControlTemplateDirective} from './control-template.directive';

export interface MultiselectItem {
  value: unknown
}

@Component({
  selector: 'cm-multiselect',
  standalone: true,
  template: `
    <div class="multiselect">
      <ng-select (change)="onChangeSelect($event)"
                 (ngModelChange)="onChangeInput($event)"
                 [appendTo]="appendTo()"
                 [attr.data-u2e]="'multiselect.' + name()"
                 [compareWith]="compareWithFn() ?? compareWith"
                 [items]="loadedList()"
                 [multiple]="multi()"
                 [ngModel]="value()"
                 [placeholder]="placeholder"
                 [searchFn]="searchFn">
        <ng-template let-item="item" ng-label-tmp>
          @if (labelTemplate()) {
            <ng-container *ngTemplateOutlet="labelTemplate()?.templateRef; context: { $implicit: item }"></ng-container>
          } @else {
            {{ (labelFactory()?.(item) ?? '') }}
          }
        </ng-template>
        <ng-template let-item="item" ng-option-tmp>
          @if (optionTemplate()) {
            <ng-container
              *ngTemplateOutlet="optionTemplate()?.templateRef; context: { $implicit: item }"></ng-container>
          } @else {
            {{ (labelFactory()?.(item) ?? '') }}
          }
        </ng-template>
      </ng-select>
    </div>
  `,
  imports: [
    NgSelectComponent,
    FormsModule,
    NgOptionTemplateDirective,
    NgLabelTemplateDirective,
    NgTemplateOutlet,
  ],
  styles: [
    `
      cm-multiselect {
        display: flex;
        flex: 1;
        min-width: 150px;
      }

      .multiselect {
        flex: 1;
        width: 100%;

        .ng-select.ng-select-focused .ng-select-container {
          outline: none;
          box-shadow: var(--focus-shadow);
          border-radius: 12px;
        }

        .ng-select.ng-select-single .ng-select-container {
          height: 51px;
        }

        .ng-select .ng-select-container {
          border: none;
          border-radius: 12px;
          background-color: var(--control-bg);

          .ng-value-container {
            padding-left: 16px !important;
          }

          .ng-input {
            top: 16px !important;
            padding-left: 16px !important;

            & > input {
              color: var(--text);
              font-family: inherit;
              font-size: inherit;
            }
          }

          .ng-value {
            //white-space: normal !important;
            //width: calc(100% - 20px);
          }
        }

        .ng-dropdown-panel {
          border: none;
          box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          overflow: hidden;

          .ng-option {
            padding: 16px;
            border-radius: 12px;
          }
        }
      }

    `
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiselectComponent),
      multi: true
    }
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiselectComponent
  implements ControlValueAccessor, OnInit {
  constructor(
    @Optional() private _selectResourcesService: SelectResourcesService,
  ) {
  }

  @Input() placeholder: string = '';
  labelFactory = input<((item: any) => string) | null>((item) => (item?.name ?? item?.value ?? item));
  optionFactory = input<((item: any) => string) | null>((item) => (item?.name ?? item?.value ?? item));
  resource = input<string>('');
  appendTo = input<string>('');
  name = input<string>('');
  compareField = input<string>('uuid');
  autoLoad = input<boolean>(false);
  multi = input<boolean>(false);
  staticItems = input<unknown[]>([]);
  loadedList = signal<unknown[]>([]);
  onSelected = output<unknown>();
  value = signal<unknown>(null)
  compareWithFn = input<((a: MultiselectItem, b: MultiselectItem) => boolean)>();
  selectComponent = viewChild(NgSelectComponent);
  templates = contentChildren(ControlTemplateDirective);
  labelTemplate = computed(() => this.templates().find(t => t.type() === 'label'));
  optionTemplate = computed(() => this.templates().find(t => t.type() === 'option'));

  // Эффект для обновления списка при изменении staticItems
  private updateStaticItemsEffect = effect(() => {
    const staticItems = this.staticItems();
    if (staticItems.length > 0) {
      this.loadedList.set(staticItems);
    }
  });

  onChange: (value: unknown) => void = () => {
  };

  onTouched: () => void = () => {
  };

  searchFn = (term: string, item: MultiselectItem) => {
    const val = item as any;

    return val.name?.toLowerCase().includes(term.toLowerCase())
      || val?.toString().toLowerCase().includes(term.toLowerCase())
  }

  compareWith = (a: MultiselectItem, b: MultiselectItem) => {
    const valA = a as any;
    const valB = b as any;

    return valA?.[this.compareField()] === valB
      || valA === valB
      || valA?.[this.compareField()] === valB?.[this.compareField()]
      || valA === valB?.[this.compareField()]
  }

  writeValue(value: unknown): void {
    this.change(value);
  }

  change(value: unknown) {
    this.value.set(value);
    this.onChange(this.value());
  }

  registerOnChange(fn: any) {
    this.onChange = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouched = fn;
  }

  onChangeInput(value: unknown) {
    this.change(value);
  }

  onChangeSelect(value: unknown) {
    this.change(value);
    this.onSelected.emit(value);
  }

  ngOnInit() {
    // Если есть статические элементы, используем их
    if (this.staticItems().length > 0) {
      this.loadedList.set(this.staticItems());
      return;
    }

    // Иначе используем SelectResourcesService
    this._selectResourcesService.register(this.resource());
    if (this.autoLoad()) {
      this._selectResourcesService.load([this.resource()]);
    }
    this._selectResourcesService.subscribe((registry) => {
      const items = registry.get(this.resource())?.list ?? [];
      this.loadedList.set(items as any);
    });
  }

  reload() {
    return this._selectResourcesService.load([this.resource()], true);
  }
}
