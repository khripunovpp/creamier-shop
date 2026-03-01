import {Component, effect, inject, resource, signal} from '@angular/core';
import {form, FormField, required} from '@angular/forms/signals';
import {FlexColumnComponent} from '../../shared/ui/layout/flex-column.component';
import {FlexRowComponent} from '../../shared/ui/layout/flex-row.component';
import {TitleComponent} from '../../shared/ui/layout/title.component';
import {BackLinkComponent} from '../../shared/ui/back-link.component';
import {InputComponent} from '../../shared/ui/controls/input.component';
import {ControlComponent} from '../../shared/ui/controls/control-item/control.component';
import {ButtonComponent} from '../../shared/ui/controls/button/button.component';
import {CategoriesService} from '../categories.service';
import {finalize, firstValueFrom} from 'rxjs';
import {NotificationsService} from '../../shared/services/notifications.service';
import {ContainerComponent} from '../../shared/ui/layout/container.component';
import {InlineCircleLoaderComponent} from '../../shared/ui/inline-circle-loader.component';
import {injectParams} from '../../shared/helpers/route.helpers';
import {Router} from '@angular/router';

export interface CategoryModel {
  name: string;
}

@Component({
  selector: 'cm-category-builder',
  host: {
    class: 'cm-host-expanded'
  },
  template: `
    <cm-container>
      <cm-flex-column>
        <cm-flex-row size="small" [center]="true">
          <cm-back-link [segments]="['/categories']"></cm-back-link>
          <cm-title>{{ uuid() ? 'Edit Category' : 'New Category' }}</cm-title>

          @if (stored.isLoading()) {
            <cm-inline-circle-loader></cm-inline-circle-loader>
          }
        </cm-flex-row>

        <form (submit)="onSubmit($event)" novalidate>
          <cm-flex-column>
            <cm-control label="Name">
              <cm-input [formField]="categoryForm.name"></cm-input>
            </cm-control>

            <cm-flex-row size="small" [center]="true">
              <cm-button type="submit">
                Save
              </cm-button>
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
    FlexColumnComponent,
    FlexRowComponent,
    TitleComponent,
    BackLinkComponent,
    InputComponent,
    FormField,
    ControlComponent,
    ButtonComponent,
    ContainerComponent,
    InlineCircleLoaderComponent,
  ],
  styles: `
    :host {
      --control-bg: #fff;
    }
  `
})
export class CategoryBuilderComponent {
  constructor() {}

  readonly uuid = injectParams<string>('uuid');
  readonly categoryModel = signal<CategoryModel>({name: ''});
  readonly categoryForm = form(
    this.categoryModel,
    (path) => {
      required(path.name);
    }
  );
  readonly loading = signal(false);

  private readonly _categoriesService = inject(CategoriesService);
  private readonly _notificationsService = inject(NotificationsService);
  private readonly _router = inject(Router);

  readonly stored = resource({
    params: () => ({uuid: this.uuid()}),
    loader: ({params}) => {
      if (!params.uuid) {
        return Promise.resolve(null);
      }
      return firstValueFrom(this._categoriesService.getOneCategory(params.uuid));
    },
  });

  readonly storedEffect = effect(() => {
    const value = this.stored.value();
    if (value) {
      this.categoryModel.set({name: value.name});
    }
  });

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.categoryForm().invalid()) {
      this._notificationsService.warning('Please fill in all required fields correctly.');
      return;
    }
    this.loading.set(true);
    const modelValue = {name: this.categoryModel().name};
    const request = this.uuid()
      ? this._categoriesService.updateCategory(this.uuid()!, modelValue)
      : this._categoriesService.createCategory(modelValue);

    request
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this._notificationsService.success(
            this.uuid() ? 'Category updated successfully.' : 'Category created successfully.'
          );
          this._router.navigate(['/categories']);
        },
        error: (error) => {
          this._notificationsService.error('Failed to save category. Please try again.');
          console.error('Error saving category:', error);
        },
      });
  }
}

