import {
  ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal,
} from '@angular/core';
import { I18nService } from '../../service/services/i18n.service';
import { Flavor } from '../../types/flavor.type';
import { FlavorCardComponent } from './flavor-card.component';

@Component({
  selector: 'cmh-flavor-carousel',
  imports: [FlavorCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="product__bhead">
      <div class="product__btitle">{{ headTitle() }}</div>
      @if (scrollable()) {
        <div class="product__nav">
          <button (click)="prev()" [disabled]="!canPrev()"
                  aria-label="Previous" class="product__nbtn" type="button">←
          </button>
          <button (click)="next()" [disabled]="!canNext()"
                  aria-label="Next" class="product__nbtn product__nbtn--next" type="button">→
          </button>
        </div>
      }
    </div>
    <div class="carousel-wrap">
      <div class="carousel-ov">
        <div [style.transform]="trackTransform()"
             [style.width.%]="trackWidth()"
             class="carousel-track">
          @for (f of flavors(); track f.id; let i = $index) {
            <div [style.width.%]="slotWidth()" class="carousel-slot">
              <cmh-flavor-card
                (cardClick)="flavorClick.emit(f)"
                [disabled]="disabled()"
                [flavor]="f"
                [index]="i"
                [selected]="isSelected(f.id)"/>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: `
    .product__bhead { display: flex; justify-content: space-between; align-items: center;
                      padding: 20px 32px; border-bottom: 1px solid var(--line); }
    .product__btitle { font-family: var(--f-disp); font-style: italic; font-size: 24px; color: var(--forest); }
    .product__nav { display: flex; gap: 10px; align-items: center; }
    .product__nbtn { width: 44px; height: 44px; border: 1px solid var(--line);
                     background: transparent; color: var(--forest); font-family: var(--f-disp);
                     font-size: 22px; display: flex; align-items: center; justify-content: center;
                     cursor: pointer; transition: opacity .15s; }
    .product__nbtn:disabled { opacity: .35; cursor: not-allowed; }
    .product__nbtn--next:not(:disabled) { border-color: var(--forest); background: var(--forest); color: var(--cream); }

    .carousel-wrap { padding: 32px 14px 24px; }
    .carousel-ov { overflow: hidden; }
    .carousel-track { display: flex; transition: transform .5s cubic-bezier(.65,0,.35,1); }
    .carousel-slot { flex-shrink: 0; padding: 0 14px; }
  `,
})
export class FlavorCarouselComponent {
  readonly i18n = inject(I18nService);

  readonly flavors     = input.required<Flavor[]>();
  readonly selectedIds = input<string[]>([]);
  readonly disabled    = input(false);

  readonly flavorClick = output<Flavor>();

  private readonly _perView  = signal(4);
  private readonly _startIdx = signal(0);

  readonly maxStart       = computed(() => Math.max(0, this.flavors().length - this._perView()));
  readonly scrollable     = computed(() => this.maxStart() > 0);
  readonly canPrev        = computed(() => this._startIdx() > 0);
  readonly canNext        = computed(() => this._startIdx() < this.maxStart());
  readonly trackWidth     = computed(() => {
    const len = this.flavors().length;
    return len ? len * 100 / this._perView() : 100;
  });
  readonly slotWidth      = computed(() => {
    const len = this.flavors().length;
    return len ? 100 / len : 100;
  });
  readonly trackTransform = computed(() => {
    const len = this.flavors().length;
    return len ? `translateX(-${this._startIdx() * 100 / len}%)` : 'none';
  });
  readonly headTitle = computed(() =>
    this.flavors().length + ' ' + this.i18n.t('композиций на выбор', 'composições à escolha')
  );

  constructor() {
    if (typeof window !== 'undefined') {
      const update = () => this._perView.set(this._readPerView());
      update();
      ['(max-width: 767px)', '(max-width: 1023px)'].forEach(q => {
        window.matchMedia(q).addEventListener('change', update);
      });
    }

    // If perView grows past current startIdx, snap startIdx back so we don't
    // leave the user staring at an empty tail.
    effect(() => {
      const max = this.maxStart();
      if (this._startIdx() > max) this._startIdx.set(max);
    });
  }

  isSelected(id: string): boolean { return this.selectedIds().includes(id); }
  prev(): void { this._startIdx.update(v => Math.max(0, v - 1)); }
  next(): void { this._startIdx.update(v => Math.min(this.maxStart(), v + 1)); }

  private _readPerView(): number {
    if (window.matchMedia('(max-width: 767px)').matches) return 1;
    if (window.matchMedia('(max-width: 1023px)').matches) return 2;
    return 4;
  }
}
