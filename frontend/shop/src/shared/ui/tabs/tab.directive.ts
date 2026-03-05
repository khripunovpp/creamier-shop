import {Directive, input, Input, TemplateRef} from '@angular/core';

@Directive({
  selector: 'ng-template[cmhTab]',
})
export class TabDirective {
  constructor(
    public templateRef: TemplateRef<unknown>
  ) {
  }

  label = input<string>('');
  alias = input<string>('');
  display = input<boolean>(true);
}
