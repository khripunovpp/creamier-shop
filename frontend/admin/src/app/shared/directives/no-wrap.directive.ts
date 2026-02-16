import {Directive, HostBinding} from '@angular/core';

@Directive({
  standalone: true,
  selector: '[cmNoWrap]',
})
export class NoWrapDirective {
  constructor() {
  }

  @HostBinding('style.white-space') whiteSpace = 'nowrap';
}
