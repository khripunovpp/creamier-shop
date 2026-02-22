import {Component, input} from '@angular/core';

@Component({
  selector: 'cm-container',
  standalone: true,
  host: {
    class: 'container',
    '[class.compact]': 'compact()'
  },
  template: `
    <ng-content></ng-content>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        margin: 0 auto;
        max-width: var(--container-width);

        @media (max-width: 768px) {
          padding: 0 16px;
        }
      }
    `
  ]
})
export class ContainerComponent {
  compact = input(false)
}
