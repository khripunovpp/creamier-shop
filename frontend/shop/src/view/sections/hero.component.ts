import {Component} from '@angular/core';
import {ContainerComponent} from '../layout/container.component';

@Component({
  selector: 'cmh-hero',
  template: `
    <section class="hero">
      <cmh-container>
        Hero Text
      </cmh-container>
    </section>
  `,
  styles: `
    .hero {
      padding: 100px 0;
      background: #E1804B;
      color: #ffffff;
      font-size: 30px;
    }
  `,
  imports: [
    ContainerComponent
  ]
})
export class HeroComponent {
  constructor() {
  }
}
