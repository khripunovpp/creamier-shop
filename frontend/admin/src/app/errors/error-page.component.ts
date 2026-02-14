import {Component} from '@angular/core';

@Component({
  selector: 'cm-error-page',
  template: `
    <h1>Oops! Something went wrong.</h1>
    <p>We couldn't load the page you were looking for. Please try again later.</p>
  `,
  styles: `
    :host {
      display: block;
      text-align: center;
      padding: 2rem;
    }
  `
})
export class ErrorPageComponent {
  constructor() {
  }
}
