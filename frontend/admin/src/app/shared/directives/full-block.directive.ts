import {Directive, effect, ElementRef, input, OnInit, Renderer2} from '@angular/core';

@Directive({
  selector: '[cmFullScreenBlocker]',
})
export class FullScreenBlockerDirective implements OnInit {
  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    ) {
  }

  disabled = input();
  disabledEffect = effect(() => {
    if (this.disabled()) {
      this.renderer.setStyle(this.el.nativeElement, 'pointer-events', 'none');
      this.renderer.setStyle(this.el.nativeElement, 'user-select', 'none');
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '0.5');
    } else {
      this.renderer.setStyle(this.el.nativeElement, 'pointer-events', 'auto');
      this.renderer.setStyle(this.el.nativeElement, 'user-select', 'auto');
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
    }
  });

  ngOnInit() {
    const element = this.renderer.createElement('div');

    this.renderer.setStyle(element, 'position', 'absolute');
    this.renderer.setStyle(element, 'top', '0');
    this.renderer.setStyle(element, 'left', '0');
    this.renderer.setStyle(element, 'width', '100%');
    this.renderer.setStyle(element, 'height', '100%');
    this.renderer.setStyle(element, 'user-select', 'none');
    this.renderer.setStyle(element, 'pointer-events', 'none');
    this.renderer.setStyle(element, 'z-index', '9999'); // опционально, если нужно поверх всего

    this.renderer.appendChild(this.el.nativeElement, element);

    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
  }
}
