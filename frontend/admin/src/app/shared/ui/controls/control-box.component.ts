import {Component} from '@angular/core';

@Component({
  selector: 'cm-control-box',
  template: `
    <ng-content></ng-content>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex: 1;
        background-color: var(--control-box-bg);
        border-radius: 12px;
        gap: 8px;
        padding: 16px;
      }
    `,
  ],
})
export class ControlBoxComponent {

}
