import {Component} from '@angular/core';

@Component({
  selector: 'cm-dashboard',
  template: `
    <h1>Dashboard</h1>
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class DashboardComponent {
  constructor() {
  }
}
