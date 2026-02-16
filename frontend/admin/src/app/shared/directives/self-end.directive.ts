import {Directive, HostBinding, input} from '@angular/core';

@Directive({
  standalone: true,
  selector: '[cmSelfEnd]',
})
export class SelfEndDirective {
  constructor() {
  }

  cmSelfEndDisabled = input(false);

  @HostBinding('style.align-self') get selfAlign() {
    return this.cmSelfEndDisabled() ? null : 'end';
  }
}
