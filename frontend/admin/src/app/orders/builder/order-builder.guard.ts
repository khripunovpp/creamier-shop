import { CanDeactivateFn } from '@angular/router';
import { OrderBuilderComponent } from './order-builder.component';

export const orderBuilderCanDeactivate: CanDeactivateFn<OrderBuilderComponent> =
  (component) => {
    if (!component.dirty()) return true;
    return confirm('Несохранённые изменения. Уйти со страницы?');
  };
