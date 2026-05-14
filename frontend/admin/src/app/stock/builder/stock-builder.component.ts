import { Component, effect, inject, resource, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { FlexColumnComponent } from '../../shared/ui/layout/flex-column.component';
import { FlexRowComponent }    from '../../shared/ui/layout/flex-row.component';
import { TitleComponent }      from '../../shared/ui/layout/title.component';
import { BackLinkComponent }   from '../../shared/ui/back-link.component';
import { InputComponent }      from '../../shared/ui/controls/input.component';
import { NumberInputComponent } from '../../shared/ui/controls/number-input.component';
import { ControlComponent }    from '../../shared/ui/controls/control-item/control.component';
import { ButtonComponent }     from '../../shared/ui/controls/button/button.component';
import { TextareaComponent }   from '../../shared/ui/controls/textarea.component';
import { RadioComponent }      from '../../shared/ui/controls/radio.component';
import { ContainerComponent }  from '../../shared/ui/layout/container.component';
import { InlineCircleLoaderComponent } from '../../shared/ui/inline-circle-loader.component';
import { PhotoPickerComponent } from '../../photos/photo-picker.component';
import { StockService, CreateStockItemDto, UpdateStockItemDto } from '../stock.service';
import { NotificationsService } from '../../shared/services/notifications.service';
import { injectParams } from '../../shared/helpers/route.helpers';
import { finalize, firstValueFrom, Observable } from 'rxjs';

interface StockItemModel {
  name: string;
  name_pt: string;
  detail_ru: string;
  detail_pt: string;
  tags_ru: string;
  tags_pt: string;
  photo_url: string | null;
  position: number;
  price: number;
  cost_price: number;
  badge: 'sale' | 'hot' | '';
}

@Component({
  selector: 'cm-stock-builder',
  host: { class: 'cm-host-expanded' },
  template: `
    <cm-container>
      <cm-flex-column>
        <cm-flex-row [center]="true" size="small">
          <cm-back-link [segments]="['/stock']"></cm-back-link>
          <cm-title>{{ uuid() ? 'Edit Flavor' : 'New Flavor' }}</cm-title>
          @if (stored.isLoading()) {
            <cm-inline-circle-loader></cm-inline-circle-loader>
          }
        </cm-flex-row>

        <form (submit)="onSubmit($event)" novalidate>
          <cm-flex-column>
            <cm-flex-row [equal]="true" size="small">
              <cm-control label="Name (RU)">
                <cm-input [formField]="stockForm.name"></cm-input>
              </cm-control>
              <cm-control label="Name (PT)">
                <cm-input [formField]="stockForm.name_pt"></cm-input>
              </cm-control>
            </cm-flex-row>

            <cm-flex-row [equal]="true" size="small">
              <cm-control label="Detail (RU)">
                <cm-textarea [formField]="stockForm.detail_ru"></cm-textarea>
              </cm-control>
              <cm-control label="Detail (PT)">
                <cm-textarea [formField]="stockForm.detail_pt"></cm-textarea>
              </cm-control>
            </cm-flex-row>

            <cm-flex-row [equal]="true" size="small">
              <cm-control label="Tags (RU, comma-separated)">
                <cm-input [formField]="stockForm.tags_ru" placeholder="cl, fr, vg"></cm-input>
              </cm-control>
              <cm-control label="Tags (PT, comma-separated)">
                <cm-input [formField]="stockForm.tags_pt" placeholder="cl, fr, vg"></cm-input>
              </cm-control>
            </cm-flex-row>

            <cm-control label="Photo">
              <cm-photo-picker
                (valueChange)="setPhoto($event)"
                [value]="model().photo_url"/>
            </cm-control>

            <cm-flex-row [equal]="true" size="small">
              <cm-control label="Position">
                <cm-number-input [formField]="stockForm.position"></cm-number-input>
              </cm-control>
              <cm-control label="Cost Price">
                <cm-number-input [formField]="stockForm.cost_price"></cm-number-input>
              </cm-control>
            </cm-flex-row>

            <!--            <cm-control label="Badge">-->
            <!--              <cm-flex-row size="small">-->
            <!--                <cm-radio size="small" [markOnHover]="true" payload="" [formField]="stockForm.badge">None</cm-radio>-->
            <!--                <cm-radio size="small" [markOnHover]="true" payload="sale" [formField]="stockForm.badge">Sale</cm-radio>-->
            <!--                <cm-radio size="small" [markOnHover]="true" payload="hot"  [formField]="stockForm.badge">Hot</cm-radio>-->
            <!--              </cm-flex-row>-->
            <!--            </cm-control>-->

            <cm-flex-row [center]="true" size="small">
              <cm-button type="submit">Save</cm-button>
              @if (loading()) {
                <cm-inline-circle-loader></cm-inline-circle-loader>
              }
            </cm-flex-row>
          </cm-flex-column>
        </form>
      </cm-flex-column>
    </cm-container>
  `,
  imports: [
    FlexColumnComponent, FlexRowComponent, TitleComponent, BackLinkComponent,
    InputComponent, FormField, NumberInputComponent, ControlComponent, ButtonComponent,
    ContainerComponent, InlineCircleLoaderComponent, TextareaComponent,
    RadioComponent, PhotoPickerComponent,
  ],
  styles: `
    :host { --control-bg: #fff; }
  `,
})
export class StockBuilderComponent {
  readonly uuid = injectParams<string>('uuid');

  readonly model = signal<StockItemModel>({
    name: '', name_pt: '',
    detail_ru: '', detail_pt: '',
    tags_ru: '', tags_pt: '',
    photo_url: null,
    position: 0,
    price: 0, cost_price: 0,
    badge: '',
  });

  readonly stockForm = form(this.model, (path) => {
    required(path.name);
    required(path.name_pt);
  });

  readonly loading = signal(false);
  private readonly _stock = inject(StockService);
  private readonly _notifications = inject(NotificationsService);

  readonly stored = resource({
    params: () => ({ uuid: this.uuid() }),
    loader: ({ params }) => {
      if (!params.uuid) return Promise.resolve(null);
      return firstValueFrom(this._stock.getOneProduct(params.uuid));
    },
  });

  readonly _hydrate = effect(() => {
    const v = this.stored.value();
    if (!v) return;
    this.model.set({
      name: v.name ?? '',
      name_pt: v.name_pt ?? '',
      detail_ru: v.detail_ru ?? '',
      detail_pt: v.detail_pt ?? '',
      tags_ru: (v.tags_ru ?? []).join(', '),
      tags_pt: (v.tags_pt ?? []).join(', '),
      photo_url: v.photo_url,
      position: v.position ?? 0,
      price: v.price ?? 0,
      cost_price: v.cost_price ?? 0,
      badge: v.badge ?? '',
    });
  });

  setPhoto(url: string | null): void {
    this.model.update(m => ({ ...m, photo_url: url }));
  }

  private _splitTags(value: string): string[] {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.stockForm().invalid()) {
      this._notifications.warning('Please fill in all required fields correctly.');
      return;
    }
    this.loading.set(true);
    const id = this.uuid();
    const req$ = id
      ? this._stock.updateProduct(id, this._toUpdateDto()) as Observable<unknown>
      : this._stock.createProduct(this._toCreateDto()) as Observable<unknown>;

    req$
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => this._notifications.success('Saved.'),
        error: (err: unknown) => {
          this._notifications.error('Failed to save.');
          console.error(err);
        },
      });
  }

  private _toUpdateDto(): UpdateStockItemDto {
    const m = this.model();
    // No `status` — that's managed by the dedicated activate/deactivate/archive
    // endpoints; sending it from this form would clobber the current status.
    return {
      name: m.name,
      name_pt: m.name_pt,
      detail_ru: m.detail_ru || null,
      detail_pt: m.detail_pt || null,
      tags_ru: this._splitTags(m.tags_ru).length ? this._splitTags(m.tags_ru) : null,
      tags_pt: this._splitTags(m.tags_pt).length ? this._splitTags(m.tags_pt) : null,
      photo_url: m.photo_url,
      position: +m.position,
      price: +m.price,
      cost_price: +m.cost_price,
      badge: (m.badge || null) as 'sale' | 'hot' | null,
    };
  }

  private _toCreateDto(): CreateStockItemDto {
    return { ...this._toUpdateDto(), status: 'stopped' } as CreateStockItemDto;
  }
}
