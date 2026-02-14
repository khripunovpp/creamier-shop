import {Directive, inject, input, TemplateRef} from '@angular/core';

export type ControlTemplateType = 'label' | 'option'

@Directive({
  selector: '[lgControlTpl]',
})
export class ControlTemplateDirective {
  readonly type = input<ControlTemplateType>();
  readonly templateRef = inject(TemplateRef);
}
