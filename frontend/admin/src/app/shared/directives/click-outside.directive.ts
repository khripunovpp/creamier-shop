import {Directive, ElementRef, EventEmitter, Output} from '@angular/core';

@Directive({
  selector: '[cmClickOutside]',
  standalone: true,
  host: {
    '(document:click)': 'onClick($event)',
    '(document:touchstart)': 'onClick($event)',
    '(document:mousedown)': 'onClick($event)',
    '(document:mouseup)': 'onClick($event)',
  }
})
export class ClickOutsideDirective {
  constructor(
    public elementRef: ElementRef<HTMLElement>
  ) {
  }

  @Output() cmClickOutside = new EventEmitter<MouseEvent | TouchEvent>();

  onClick(event: MouseEvent | TouchEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.cmClickOutside.emit(event);
    }
  }
}
