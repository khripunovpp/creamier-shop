import {ChangeDetectionStrategy, Component, input} from '@angular/core';

@Component({
  selector: 'cm-badge',
  host: {
    class: 'cm-badge',
    '[class.primary]': 'appearance() === "primary"',
    '[class.secondary]': 'appearance() === "secondary"',
    '[class.success]': 'appearance() === "success"',
    '[class.danger]': 'appearance() === "danger"',
  },
  template: `
    @if (label()) {
      {{ label() }}
    } @else {
      <ng-content></ng-content>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 8px;
      font-size: 0.75em;
      border-radius: 100px;
    }

    :host(.primary) {
      background-color: var(--badge-primary-color);
      color: var(--badge-primary-text-color);
    }

    :host(.secondary) {
      background-color: var(--badge-secondary-color);
      color: var(--badge-secondary-text-color);
    }

    :host(.success) {
      background-color: var(--badge-success-color);
      color: var(--badge-success-text-color);
    }

    :host(.danger) {
      background-color: var(--badge-danger-color);
      color: var(--badge-danger-text-color);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  constructor() {
  }
  label = input('');
  appearance = input<'primary' | 'secondary' | 'success' | 'danger'>('primary');
}
