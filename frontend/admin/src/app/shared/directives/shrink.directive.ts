import {Directive, HostBinding} from '@angular/core';

@Directive({
  standalone: true,
  selector: '[cmShrink]',
})
export class ShrinkDirective {
  constructor() {
  }

  @HostBinding('style.flex-shrink') flexShrink = '1';
  // @HostBinding('style.align-self') alignSelf = 'flex-start';
  @HostBinding('style.width') width = 'auto';
}
