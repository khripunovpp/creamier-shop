import {Directive, inject, input, TemplateRef} from '@angular/core';

@Directive({
  selector: '[cmControlLabelTemplate]',
  exportAs: 'cmControlLabelTemplate',
  host: {}
})
export class ControlLabelTemplateDirective {
  templateRef = inject(TemplateRef);
  /**
   * Position of the label in the control.
   * Possible values: 'before', 'after', 'end'.
   */
  position = input<string | null>(null);
}
