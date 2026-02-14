import {Component} from '@angular/core';
import {ContainerComponent} from '../layout/container.component';

@Component({
  selector: 'cmh-hero',
  template: `
    <section class="hero">
      <cmh-container>
       <h1 style="margin: 0">Welcome to our shop! </h1>
        We offer a wide range of products at affordable prices. Browse our selection and find the perfect item for you.
      </cmh-container>
    </section>
  `,
  styles: `
    .hero {
      padding: 100px 0;
      background: #E1804B;
      color: #ffffff;
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
