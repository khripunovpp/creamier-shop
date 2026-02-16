import {Directive, HostBinding, input} from '@angular/core';

@Directive({
  standalone: true,
  selector: '[cmSelfStart]',
})
export class SelfStartDirective {
  constructor() {
  }

  cmSelfStartDisabled = input(false);

  @HostBinding('style.align-self') get selfAlign() {
    return this.cmSelfStartDisabled() ? null : 'start';
  }
}
