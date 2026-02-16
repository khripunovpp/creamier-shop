import {Component, inject, input} from '@angular/core';
import {IS_HOME} from '../providers/is_home_page.provider';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'cm-back-link',
  template: `
    <a [routerLink]="segments()">
      <img src="/icons/back-icon.svg"
           alt="Back"
           class="back-link__icon">
    </a>
  `,
  imports: [
    RouterLink
  ],
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      font-size: 20px;
      color: inherit;
    }

    a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: inherit;
      margin-right: 8px;
    }

    .back-link__icon {
      width: 16px;
      height: 16px;
    }
  `
})
export class BackLinkComponent {
  constructor() {
  }
  readonly segments = input.required<string[]>();
}
