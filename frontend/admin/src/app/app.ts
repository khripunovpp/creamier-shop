import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';


@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet
  ],
  template: `
    <div class="page-wrapper">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: `
    :host {

    }
    .page-wrapper {
      width: 100%;
      padding: 32px;
    }
  `
})
export class App {
  constructor() {
  }
}
