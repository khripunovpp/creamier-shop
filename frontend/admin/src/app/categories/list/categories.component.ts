import {ChangeDetectionStrategy, Component, inject, resource} from '@angular/core';
import {Category, CategoriesService} from '../categories.service';
import {TableCardComponent} from '../../shared/ui/card/table-card.component';
import {InlineCircleLoaderComponent} from '../../shared/ui/inline-circle-loader.component';
import {FlexRowComponent} from '../../shared/ui/layout/flex-row.component';
import {TitleComponent} from '../../shared/ui/layout/title.component';
import {FlexColumnComponent} from '../../shared/ui/layout/flex-column.component';
import {ButtonComponent} from '../../shared/ui/controls/button/button.component';
import {PullDirective} from '../../shared/directives/pull.directive';
import {HomeLinkComponent} from '../../shared/ui/home-link.component';
import {ContainerComponent} from '../../shared/ui/layout/container.component';
import {NotificationsService} from '../../shared/services/notifications.service';
import {RouterLink} from '@angular/router';
import {DatePipe} from '@angular/common';
import {firstValueFrom} from 'rxjs';

@Component({
  selector: 'cm-categories',
  host: {
    class: 'cm-host-expanded'
  },
  template: `
    <cm-container>
      <cm-flex-column>
        <cm-flex-row size="small" [center]="true">
          <cm-home-link></cm-home-link>

          <cm-title>Categories</cm-title>

          @if (categories.isLoading()) {
            <cm-inline-circle-loader></cm-inline-circle-loader>
          }

          <cm-button cmPull
                     link="/categories/create"
                     appearance="primary"
                     size="tiny">Create
          </cm-button>
        </cm-flex-row>

        @if (categories.hasValue()) {
          <cm-table-card [size]="'medium'">
            <table>
              <colgroup>
                <col span="1" style="width: 60%;">
                <col span="1" style="width: 40%;">
              </colgroup>
              <thead>
              <tr>
                <th align="left">Name</th>
                <th align="left">Created At</th>
              </tr>
              </thead>
              <tbody>
                @for (category of categories.value(); track category.id) {
                  <tr>
                    <td>
                      <a class="cm-link"
                         [routerLink]="['/categories', category.id]">
                        {{ category.name }}
                      </a>
                    </td>
                    <td>{{ category.created_at | date:'mediumDate' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </cm-table-card>
        }

        @if (categories.hasValue() && categories.value()!.length === 0) {
          <p>No categories yet. Create the first one!</p>
        }
      </cm-flex-column>
    </cm-container>
  `,
  imports: [
    TableCardComponent,
    InlineCircleLoaderComponent,
    FlexRowComponent,
    TitleComponent,
    FlexColumnComponent,
    ButtonComponent,
    PullDirective,
    HomeLinkComponent,
    ContainerComponent,
    RouterLink,
    DatePipe,
  ],
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent {
  constructor() {}

  private readonly _categoriesService = inject(CategoriesService);
  private readonly _notificationsService = inject(NotificationsService);

  readonly categories = resource({
    loader: () => firstValueFrom(this._categoriesService.getCategories()),
  });
}




