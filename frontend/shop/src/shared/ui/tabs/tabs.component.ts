import {Component, contentChildren, effect, inject, input, signal, ViewEncapsulation,} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {TabDirective} from './tab.directive';
import {Router} from '@angular/router';
import {injectQueryParams} from '../../../service/helpers/route.helpers';
import {FlexColumnComponent} from '../../../view/layout/flex-column.component';

@Component({
  selector: 'cmh-tabs',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    FlexColumnComponent,

  ],
  template: `
    <div [attr.aria-label]="'Tabs'"
         [attr.data-u2e]="'tabs.' + name()"
         [attr.role]="'tablist'"
         [class.flat]="flat()"
         [class.scrollable]="scrollable()"
         class="tabs"
         role="tablist">
      <div class="tabs__labels">
        @for (tab of tabs(); track tab.label(); let i = $index) {
          @if (tab.display()) {
            <button (click)="selectTab(i)"
                    [class.active]="activated()[i]"
                    role="tab"
                    [attr.aria-selected]="activated()[i]"
                    [attr.aria-controls]="'tab-' + i"
                    [attr.data-u2e]="'tabs.' + name() + '.label.' + i"
                    [attr.id]="'tab-' + i">
              {{ tab.label() }}
            </button>
          }
        }
      </div>

      <div [attr.aria-labelledby]="'tab-' + selectedIndex()" [attr.data-u2e]="'tabs.' + name() + '.body'"
           [attr.id]="'tab-' + selectedIndex()"
           class="tabs__body"
           role="tabpanel">
        @if (tabs().length > 0) {
          @if (activated()[selectedIndex()]) {
            <cmh-flex-column [size]="'small'">
              <ng-container *ngTemplateOutlet="tabs()[selectedIndex()].templateRef">
              </ng-container>
            </cmh-flex-column>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .tabs {
      display: flex;
      flex-direction: column;
    }

    .tabs.flat {
      gap: 12px;
      margin: -2px;
    }

    .tabs.scrollable .tabs__labels {
      overflow-x: auto;
      white-space: nowrap;
      scroll-behavior: smooth;
      scroll-snap-type: x mandatory;
      overscroll-behavior-x: contain;
      -webkit-overflow-scrolling: touch;
    }

    .tabs.flat .tabs__labels {
      border-radius: 0;
      border-bottom: 1px solid #f5f5f5;
      padding: 2px 2px 12px;
      background-color: transparent;
    }

    .tabs__labels {
      display: flex;
      gap: 8px;
      padding: 16px;
      background-color: var(--tabs-labels-bg);

      border-radius: 32px 32px 0 0;
      border-bottom: 1px solid #ececec;
    }

    .tabs__labels button {
      background: var(--tabs-label-bg);
      color: var(--tabs-label-color);
      border: 1px solid transparent;
      border-radius: 16px;
      padding: 12px;
      cursor: pointer;
      font-size: 14px;
      transition: background-color 0.3s ease;
      font-family: inherit;
      text-decoration: none;
      position: relative;
      z-index: 1;
    }

    .tabs__labels button:hover {
      background-color: var(--tabs-label-hover-bg);
    }

    .tabs__labels button:focus {
      outline: 2px solid var(--tabs-label-focus);
    }

    .tabs__labels button.active {
      background-color: var(--tabs-label-active-bg);
      color: var(--tabs-label-active-text);
    }

    .tabs.flat .tabs__labels button {
      padding: 8px 12px;
      border-radius: 6px;
    }

    .tabs.flat .tabs__labels button:not(.active) {
      background-color: transparent;
      color: var(--tabs-label-flat-text);
    }

    .tabs.flat .tabs__labels button:not(.active):hover {
      background-color: var(--tabs-label-flat-active-hover-bg);
    }

    .tabs.flat .tabs__labels button.active {
      background-color: var(--tabs-label-flat-active-bg);
      color: var(--tabs-label-flat-text);
    }

    .tabs__body {
      display: flex;
      flex-direction: column;
      padding: 16px;
      background-color: var(--tabs-body-bg);
      border-radius: 0 0 32px 32px;
    }

    .tabs__body > * {
      flex: 1;
    }

    .tabs.flat .tabs__body {
      border-radius: 0;
      background-color: transparent;
      padding: 0;
    }
  `],
  encapsulation: ViewEncapsulation.None,
})
export class TabsComponent {
  readonly tabTemplates = contentChildren(TabDirective);
  readonly router = inject(Router);
  readonly tabs = signal<readonly TabDirective[]>([]);
  readonly flat = input(false)
  readonly name = input('')
  readonly silent = input(false)
  readonly scrollable = input(true)
  readonly activated = signal<boolean[]>([]);
  readonly selectedIndex = signal(0);
  readonly tabQuery = injectQueryParams('tab');
  readonly tabQueryEffect = effect(() => {
    const tab = this.tabQuery();
    const tabs = this.tabs();
    if (tab) {
      const index = tabs
        .findIndex(t => t.alias().toLowerCase()?.includes(tab.toString().toLowerCase() ?? ''));
      if (index !== -1) {
        this.selectTab(index);
      }
    }
  });

  tabsEffect = effect(() => {
    const allTabs = this.tabTemplates();
    this.tabs.set(allTabs);
    this.activated.set(allTabs.map((_, i) => i === this.selectedIndex()));
  });

  selectTab(index: number) {
    this.selectedIndex.set(index);
    this.activated.update((old) => {
      return old.map((_, i) => i === index);
    });
    if (this.silent()) {
      return;
    }
    this.router.navigate([], {
      queryParams: {tab: this.tabs()[index].alias()},
      queryParamsHandling: 'merge',
    });
  }
}
