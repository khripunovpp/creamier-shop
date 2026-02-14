import {Component, input, output, viewChild, ViewEncapsulation} from '@angular/core';
import {NgClass, NgTemplateOutlet} from '@angular/common';
import {RouterLink, RouterLinkActive} from '@angular/router';

export type ButtonStyle = 'default' |
  'primary' |
  'secondary' |
  'secondary-dark' |
  'solid' |
  'success' |
  'danger' |
  'warning' |
  'transcluent' |
  'info';

export type ButtonSizes =
  'regular' |
  'medium' |
  'small' |
  'tiny';

@Component({
  selector: 'cm-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    NgClass,
    RouterLink,
    NgTemplateOutlet,
    RouterLinkActive
  ],
})
export class ButtonComponent {
  constructor() {
  }

  onClick = output<any>();
  style = input<ButtonStyle>('default');
  type = input<string>('button');
  size = input<ButtonSizes>('regular');
  outlined = input<boolean>(false);
  icon = input<boolean>(false);
  flat = input<boolean>(false);
  transparent = input<boolean>(false);
  link = input<string>('');
  noRightRadius = input<boolean>(false);
  noLeftRadius = input<boolean>(false);
  noRadius = input<boolean>(false);
  noTopRadius = input<boolean>(false);
  noBottomRadius = input<boolean>(false);
  active = input<boolean>(false);
  disabled = input<boolean>(false);
  routerLinkActive = viewChild(RouterLinkActive);
  noScale = input<boolean>(false);
  label = input<string>('');

  onClickHandler(event: MouseEvent) {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    this.onClick.emit(event);
  }
}
