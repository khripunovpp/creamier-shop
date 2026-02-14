import {Component, signal} from '@angular/core';
import {HeaderComponent} from '../view/sections/header.component';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [
    HeaderComponent,
    RouterOutlet,
  ],
  template: `
    <main class="page-wrapper">
      <cmh-header></cmh-header>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: `
    .page-wrapper {
      display: flex;
      flex-direction: column;
    }
  `
})
export class App {
  protected readonly title = signal('shop');
}
