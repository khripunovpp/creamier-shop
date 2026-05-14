import {Component, computed, effect, inject, resource, signal} from '@angular/core';
import {Router} from '@angular/router';
import {applyEach, form, FormField, required} from '@angular/forms/signals';
import {firstValueFrom, Observable} from 'rxjs';
import {FlexColumnComponent} from '../../shared/ui/layout/flex-column.component';
import {FlexRowComponent} from '../../shared/ui/layout/flex-row.component';
import {TitleComponent} from '../../shared/ui/layout/title.component';
import {BackLinkComponent} from '../../shared/ui/back-link.component';
import {InputComponent} from '../../shared/ui/controls/input.component';
import {NumberInputComponent} from '../../shared/ui/controls/number-input.component';
import {TextareaComponent} from '../../shared/ui/controls/textarea.component';
import {ControlComponent} from '../../shared/ui/controls/control-item/control.component';
import {ButtonComponent} from '../../shared/ui/controls/button/button.component';
import {ContainerComponent} from '../../shared/ui/layout/container.component';
import {InlineCircleLoaderComponent} from '../../shared/ui/inline-circle-loader.component';
import {CreateStockSetDto, StockSetsService, UpdateStockSetDto} from '../stock-sets.service';
import {StockSetRulesService} from '../stock-set-rules.service';
import {StockSetItemsService} from '../stock-set-items.service';
import {StockService} from '../../stock/stock.service';
import {NotificationsService} from '../../shared/services/notifications.service';
import {injectParams} from '../../shared/helpers/route.helpers';
import {environment} from '../../../env/environment';
import {ShrinkDirective} from '../../shared/directives/shrink.directive';

interface RuleFormItem {
  id: string | null;   // null for rules added in this session
  count: number;
  price: number;
  max_flavors: number;
  position: number;
}

interface SetFormModel {
  slug: string;
  name_ru: string;
  name_pt: string;
  description_ru: string;
  description_pt: string;
  position: number;
  rules: RuleFormItem[];
}

@Component({
  selector: 'cm-stock-set-builder',
  host: {class: 'cm-host-expanded'},
  template: `
    <cm-container>
      <cm-flex-column>
        <cm-flex-row [center]="true" size="small">
          <cm-back-link [segments]="['/stock-sets']"></cm-back-link>
          <cm-title>{{ uuid() ? 'Edit Set' : 'New Set' }}</cm-title>
          @if (stored.isLoading()) {
            <cm-inline-circle-loader></cm-inline-circle-loader>
          }
        </cm-flex-row>

        <form (submit)="onSubmit($event)" novalidate>
          <cm-flex-column>
            <cm-control label="Slug (kebab-case)">
              <cm-input [formField]="setForm.slug"></cm-input>
            </cm-control>

            <cm-flex-row [equal]="true" size="small">
              <cm-control label="Name (RU)">
                <cm-input [formField]="setForm.name_ru"></cm-input>
              </cm-control>
              <cm-control label="Name (PT)">
                <cm-input [formField]="setForm.name_pt"></cm-input>
              </cm-control>
            </cm-flex-row>

            <cm-flex-row [equal]="true" size="small">
              <cm-control label="Description (RU)">
                <cm-textarea [formField]="setForm.description_ru"></cm-textarea>
              </cm-control>
              <cm-control label="Description (PT)">
                <cm-textarea [formField]="setForm.description_pt"></cm-textarea>
              </cm-control>
            </cm-flex-row>

            <cm-control label="Position">
              <cm-number-input [formField]="setForm.position"></cm-number-input>
            </cm-control>

            @if (uuid() && stored.hasValue()) {
              <cm-title [level]="3">Rules</cm-title>

              @for (ruleField of setForm.rules; track $index; let i = $index) {
                @let saved = !!model().rules[i]?.id;
                <cm-flex-row [bottom]="true" [equal]="true" size="small">
                  @if (saved) {
                    <cm-control label="Count">
                      <div class="rule-readonly">{{ model().rules[i].count }}</div>
                    </cm-control>
                    <cm-control label="Price">
                      <div class="rule-readonly">{{ model().rules[i].price }}</div>
                    </cm-control>
                    <cm-control label="Max flavors">
                      <div class="rule-readonly">{{ model().rules[i].max_flavors }}</div>
                    </cm-control>
                  } @else {
                    <cm-control label="Count">
                      <cm-number-input [formField]="ruleField.count"></cm-number-input>
                    </cm-control>
                    <cm-control label="Price">
                      <cm-number-input [formField]="ruleField.price"></cm-number-input>
                    </cm-control>
                    <cm-control label="Max flavors">
                      <cm-number-input [formField]="ruleField.max_flavors"></cm-number-input>
                    </cm-control>
                  }
                   <cm-button (onClick)="removeRule(i)"
                              cmShrink
                              [flat]="true"
                              appearance="danger"
                               size="tiny">Remove
                    </cm-button>
                </cm-flex-row>
              }

              <cm-flex-row [right]="true" size="small">
                <cm-button (onClick)="addRule()" appearance="primary" size="tiny">Add rule</cm-button>
              </cm-flex-row>
            }

            <!-- Hidden submit lets Enter inside any text field submit the form -->
            <button hidden type="submit"></button>
          </cm-flex-column>
        </form>

        @if (uuid() && stored.hasValue()) {
          <cm-flex-column>
            <cm-title [level]="3">Available flavors</cm-title>
            @if (allFlavorsRes.isLoading()) {
              <cm-inline-circle-loader></cm-inline-circle-loader>
            } @else {
              <div class="flavors-grid">
                @for (it of allFlavorsRes.value() ?? []; track it.id) {
                  @let on = linkedIds().has(it.id);
                  <button (click)="toggleLink(it.id)" [class.flavor-tile--on]="on"
                          class="flavor-tile"
                          type="button">
                    @if (it.photo_url) {
                      <img [src]="shopBase + it.photo_url" alt="" decoding="async" loading="lazy"/>
                    } @else {
                      <div class="flavor-tile__placeholder">{{ it.name }}</div>
                    }
                    <div class="flavor-tile__caption">
                      <span>{{ it.name }}</span>
                      @if (on) {
                        <span class="flavor-tile__check">✓</span>
                      }
                    </div>
                  </button>
                }
              </div>
            }
          </cm-flex-column>
        }

        <cm-flex-row [center]="true" size="small">
          <cm-button (onClick)="onSubmit($event)">Save</cm-button>
          @if (loading()) {
            <cm-inline-circle-loader></cm-inline-circle-loader>
          }
        </cm-flex-row>
      </cm-flex-column>
    </cm-container>
  `,
  imports: [
    FlexColumnComponent, FlexRowComponent, TitleComponent, BackLinkComponent,
    InputComponent, FormField, NumberInputComponent, TextareaComponent,
    ControlComponent, ButtonComponent, ContainerComponent, InlineCircleLoaderComponent, ShrinkDirective,
  ],
  styles: `
    :host {
      --control-bg: #fff;
    }

    .flavors-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    }

    .flavor-tile {
      position: relative;
      padding: 0;
      border: 2px solid transparent;
      background: #efe8dd;
      cursor: pointer;
      overflow: hidden;
      transition: border-color .15s;
    }

    .flavor-tile:hover {
      border-color: rgba(0, 0, 0, .2);
    }

    .flavor-tile--on {
      border-color: var(--p-1, #2D4A3A);
    }

    .flavor-tile img {
      width: 100%;
      aspect-ratio: 1/1;
      object-fit: cover;
      display: block;
    }

    .flavor-tile__placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 1/1;
      padding: 8px;
      font-size: 12px;
      color: #6b5e48;
      text-align: center;
      background: #f4ebd9;
    }

    .flavor-tile__caption {
      padding: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #333;
      background: #fff;
    }

    .flavor-tile__check {
      color: var(--p-1, #2D4A3A);
      font-weight: 700;
    }

    .rule-readonly {
      padding: 8px 10px;
      background: #e4e0e0;
      color: #333;
      border-radius: 12px;
      font-variant-numeric: tabular-nums;
      width: 100%;
    }
  `,
})
export class StockSetBuilderComponent {
  readonly uuid = injectParams<string>('uuid');

  readonly model = signal<SetFormModel>({
    slug: '', name_ru: '', name_pt: '',
    description_ru: '', description_pt: '',
    position: 0,
    rules: [],
  });

  readonly setForm = form(this.model, (path) => {
    required(path.slug);
    required(path.name_ru);
    required(path.name_pt);
    // Each rule must have positive count and max_flavors; price=0 is allowed.
    applyEach(path.rules, (rulePath) => {
      required(rulePath.count);
      required(rulePath.max_flavors);
    });
  });

  readonly loading = signal(false);

  readonly shopBase = environment.shop_url;
  readonly linkedIds = computed<Set<string>>(() => {
    const items = this.stored.value()?.items ?? [];
    return new Set(items
      .map(l => l.stock_item?.id ?? l.stock_item_id)
      .filter((x): x is string => !!x));
  });
  readonly _hydrate = effect(() => {
    const v = this.stored.value();
    if (!v) return;
    this.model.set({
      slug: v.slug,
      name_ru: v.name_ru,
      name_pt: v.name_pt,
      description_ru: v.description_ru ?? '',
      description_pt: v.description_pt ?? '',
      position: v.position,
      rules: (v.rules ?? []).map(r => ({
        id: r.id, count: r.count, price: r.price,
        max_flavors: r.max_flavors, position: r.position,
      })),
    });
  });
  private readonly _service = inject(StockSetsService);
  readonly stored = resource({
    params: () => ({uuid: this.uuid()}),
    loader: ({params}) => {
      if (!params.uuid) return Promise.resolve(null);
      return firstValueFrom(this._service.getOne(params.uuid));
    },
  });
  private readonly _rulesService = inject(StockSetRulesService);
  private readonly _itemsService = inject(StockSetItemsService);
  private readonly _stockService = inject(StockService);
  readonly allFlavorsRes = resource({
    loader: () => firstValueFrom(this._stockService.getProducts({withArchived: false})),
  });
  private readonly _notif = inject(NotificationsService);
  private readonly _router = inject(Router);

  addRule() {
    this.model.update(m => ({
      ...m,
      rules: [...m.rules, {id: null, count: 0, price: 0, max_flavors: 1, position: m.rules.length}],
    }));
  }

  removeRule(i: number) {
    this.model.update(m => ({...m, rules: m.rules.filter((_, idx) => idx !== i)}));
  }

  async onSubmit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.setForm().invalid()) {
      this._notif.warning('Please fill in all required fields.');
      return;
    }
    const bad = this.model().rules.find(r => r.max_flavors > r.count);
    if (bad) {
      this._notif.warning(
        `Rule ${bad.count}-pack: max_flavors (${bad.max_flavors}) cannot exceed count (${bad.count}).`);
      return;
    }
    this.loading.set(true);
    try {
      const dto = this._toDto();
      const id = this.uuid();
      const res: any = id
        ? await firstValueFrom(this._service.update(id, dto as UpdateStockSetDto) as Observable<unknown>)
        : await firstValueFrom(this._service.create(dto as CreateStockSetDto) as Observable<unknown>);

      if (id) await this._flushRules(id);

      this._notif.success('Saved.');
      if (!id && res?.id) {
        this._router.navigate(['/stock-sets', res.id]);
      } else {
        this.stored.reload();
      }
    } catch (err: any) {
      this._notif.error(err?.error?.error ?? 'Failed to save.');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleLink(itemId: string) {
    if (!this.uuid()) return;
    const linked = this.linkedIds().has(itemId);
    try {
      if (linked) {
        await firstValueFrom(this._itemsService.unlink(this.uuid()!, itemId));
        this._notif.success('Flavor unlinked');
      } else {
        await firstValueFrom(this._itemsService.link(this.uuid()!, itemId));
        this._notif.success('Flavor linked');
      }
      this.stored.reload();
    } catch (err: any) {
      this._notif.error(err?.error?.error ?? 'Failed to update link');
    }
  }

  private async _flushRules(setId: string) {
    const original = this.stored.value()?.rules ?? [];
    const current = this.model().rules;
    const currentIds = new Set(current.map(r => r.id).filter((x): x is string => !!x));

    const toDelete = original.filter(o => !currentIds.has(o.id));
    const toCreate = current.filter(r => !r.id);

    await Promise.all([
      ...toDelete.map(r => firstValueFrom(this._rulesService.remove(r.id))),
      ...toCreate.map(r => firstValueFrom(this._rulesService.create(setId, {
        count: +r.count, price: +r.price, max_flavors: +r.max_flavors, position: +r.position,
      }))),
    ]);
  }

  private _toDto(): Omit<CreateStockSetDto, 'status'> {
    const m = this.model();
    return {
      slug: m.slug.trim(),
      name_ru: m.name_ru.trim(),
      name_pt: m.name_pt.trim(),
      description_ru: m.description_ru.trim() || null,
      description_pt: m.description_pt.trim() || null,
      position: +m.position,
    };
  }
}
