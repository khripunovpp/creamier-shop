import {Component} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {ContainerComponent} from './shared/ui/layout/container.component';


@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ContainerComponent
  ],
  template: `
    <cm-container>
      <router-outlet></router-outlet>
    </cm-container>
  `,
  styles: `
    :host {
      display: block;
      height: 100dvh;
    }
  `
})
export class App {
  constructor() {
  }
}
