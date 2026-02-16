import {Directive, HostBinding} from '@angular/core';

@Directive({
  standalone: true,
  selector: '[cmPull]'
})
export class PullDirective {
  constructor() {
  }

  @HostBinding('style.margin-left') marginLeft = 'auto';
}
