import {Directive, input, TemplateRef} from '@angular/core';

@Directive({
  selector: '[lgExtraTpl]',
  standalone: true,
})
export class ControlExtraTemplateDirective {
  constructor(
    public templateRef: TemplateRef<any>,
  ) {
  }

  place = input<'before' | 'after' | 'top' | 'bottom'>('after');
}
