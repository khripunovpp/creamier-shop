import {Component, input} from '@angular/core';

@Component({
  selector: 'cmh-container',
  standalone: true,
  template: `
    <section [class.compact]="compact()"
             class="container">
      <ng-content></ng-content>
    </section>`,
  styles: [
    `
      :host {
        display: flex;
        height: 100%;
        padding: 0 32px;

        @media (max-width: 768px) {
          padding: 0 16px;
        }
      }

      .container {
        display: flex;
        flex-direction: column;
        margin: 0 auto;
        width: 100%;
        max-width: var(--container-width);
        gap: 32px;
      }

      @media (max-width:768px) {
        .container {
          gap: 16px;
        }
      }

      .container.compact {
        gap: 0 !important;
      }
    `
  ]
})
export class ContainerComponent {
  compact = input(false)
}
