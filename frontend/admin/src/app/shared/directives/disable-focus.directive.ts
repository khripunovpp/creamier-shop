import {Directive, ElementRef, input, OnDestroy, OnInit, Renderer2} from '@angular/core';

@Directive({
  selector: '[cmDisableFocus]'
})
export class DisableFocusDirective implements OnInit, OnDestroy {
  constructor(private el: ElementRef, private renderer: Renderer2) {
  }

  skipDisableFocus = input(false);

  ngOnInit(): void {
    const element = this.el.nativeElement;
    this.disableFocusRecursively(element);
  }

  ngOnDestroy(): void {
    const element = this.el.nativeElement;
    this.removeFocusListenersRecursively(element);
  }

  private focusHandler = (event: FocusEvent) => {
    if (this.skipDisableFocus()) {
      return;
    }
    event.preventDefault();
    (event.target as HTMLElement).blur();
  };

  private disableFocusRecursively(parent: HTMLElement): void {
    const focusable = parent.querySelectorAll<HTMLElement>(
      'a, button, input, textarea, select, [tabindex]'
    );

    focusable.forEach(el => {
      this.renderer.setAttribute(el, 'tabindex', '-1');
      el.addEventListener('focus', this.focusHandler, true);
    });
  }

  private removeFocusListenersRecursively(parent: HTMLElement): void {
    const focusable = parent.querySelectorAll<HTMLElement>(
      'a, button, input, textarea, select, [tabindex]'
    );

    focusable.forEach(el => {
      el.removeEventListener('focus', this.focusHandler, true);
    });
  }
}
