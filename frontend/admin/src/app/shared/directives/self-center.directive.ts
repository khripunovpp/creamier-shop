import {Directive, HostBinding} from '@angular/core';

@Directive({
  standalone: true,
  selector: '[cmSelfCenter]',
})
export class SelfCenterDirective {
  constructor() {
  }

  @HostBinding('style.align-self') selfAlign = 'center';
}
