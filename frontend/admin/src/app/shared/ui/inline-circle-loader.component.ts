import {Component, input} from '@angular/core';

@Component({
  selector: 'cm-inline-circle-loader',
  template: `
    <img src="/icons/loader.svg"
         alt="Loading..."
         class="loader">
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    .loader {
      width: 16px;
      height: 16px;
      animation: rotate 1s linear infinite;
      display: block;
    }

    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `
})
export class InlineCircleLoaderComponent {
}
