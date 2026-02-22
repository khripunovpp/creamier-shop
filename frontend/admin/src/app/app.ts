import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';


@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet
  ],
  template: `
    <router-outlet></router-outlet>
  `,
  styles: `
    :host {
      display: flex;
      height: 100dvh;
      padding: 32px;
      overflow-y: auto;
    }
  `
})
export class App {
  constructor() {
  }
}
