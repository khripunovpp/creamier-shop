import {Component} from '@angular/core';
import {OrderContentComponent} from './order-content.component';
import {ContainerComponent} from '../layout/container.component';

@Component({
  selector: 'cmh-order',
  template: `
    <section class="order">
      <cmh-container>
        Your order
        <cmh-order-content></cmh-order-content>
      </cmh-container>
    </section>
  `,
  styles: `
    .order {
      padding: 50px 0;
      background-color: #fff;
    }
  `,
  imports: [
    OrderContentComponent,
    ContainerComponent
  ]
})
export class OrderComponent {
  constructor() {
  }
}
