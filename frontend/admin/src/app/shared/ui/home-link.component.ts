import {Component, inject} from '@angular/core';
import {IS_HOME} from '../providers/is_home_page.provider';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'cm-home-link',
  template: `
    <a routerLink="/">
      <img src="/icons/home-icon.svg"
           alt="Home"
           class="home-link__icon">
    </a>
    /
  `,
  host: {
    '[attr.hidden]': '!isHome()'
  },
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

    .home-link__icon {
      width: 16px;
      height: 16px;
    }
  `
})
export class HomeLinkComponent {
  constructor() {
  }

  readonly isHome = inject(IS_HOME);
}
