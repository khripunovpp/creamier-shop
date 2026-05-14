import {
  ChangeDetectionStrategy, Component, computed, effect, inject, input, signal, untracked,
} from '@angular/core';
import { I18nService } from '../../service/services/i18n.service';
import { CartService } from '../../service/services/cart.service';
import { StockSet } from '../../types/set.type';
import { Flavor } from '../../types/flavor.type';
import { FlavorCarouselComponent } from './flavor-carousel.component';
import { OrderPanelComponent } from './order-panel.component';

@Component({
  selector: 'cmh-product-section',
  imports: [FlavorCarouselComponent, OrderPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = set();
    <section [id]="s.slug" class="product">
      <div class="product__head">
        <div>
          <div class="product__chapter">❋ {{ chapterLabel() }}</div>
          <h2 class="product__title">{{ i18n.pick(s, 'name') }}</h2>
        </div>
        <div>
          @if (i18n.pick(s, 'description')) {
            <p class="product__desc">{{ i18n.pick(s, 'description') }}</p>
          }
        </div>
      </div>

      <div class="product__box">
        <cmh-flavor-carousel
          (flavorClick)="toggleFlavor($event)"
          [disabled]="atMaxFlavors()"
          [flavors]="s.items"
          [selectedIds]="flavorIds()"/>

        <cmh-order-panel
          (addRequested)="addToCart()"
          (modeSelected)="selectMode($event)"
          (qtyChanged)="qty.set($event)"
          (ruleSelected)="selectRule($event)"
          [flavorIds]="flavorIds()"
          [mode]="mode()"
          [qty]="qty()"
          [selectedRuleId]="selectedRuleId()"
          [set]="s"/>
      </div>
    </section>
  `,
  styles: `
    /* Copied verbatim from .product, .product__head, .product__title etc. */
    .product { background: var(--bg); padding: 100px 64px; }
    .product__head { display: grid; grid-template-columns: 1fr 1fr; gap: 60px;
                     margin-bottom: 64px; align-items: end; }
    .product__chapter { font-size: 12px; font-weight: 600; letter-spacing: .22em;
                        text-transform: uppercase; color: var(--forest); margin-bottom: 24px; }
    .product__title { font-family: var(--f-disp); font-size: 96px; font-weight: 400;
                      line-height: .95; color: var(--text); margin: 0; }
    .product__desc { font-size: 16px; color: var(--text); line-height: 1.7; margin: 0; max-width: 480px; }
    .product__box { border: 1px solid var(--line); }
    @media (max-width: 1023px) {
      .product__title { font-size: 72px; }
    }
    @media (max-width: 767px) {
      .product { padding: 60px 20px; }
      .product__head { grid-template-columns: 1fr; gap: 16px; margin-bottom: 32px; }
      .product__title { font-size: 52px; }
    }
  `,
})
export class ProductSectionComponent {
  readonly i18n = inject(I18nService);
  private readonly _cart = inject(CartService);

  readonly set     = input.required<StockSet>();
  readonly chapter = input.required<{ ru: string; pt: string }>();

  readonly selectedRuleId = signal<string | null>(null);
  readonly mode           = signal<1 | 2>(1);
  readonly flavorIds      = signal<string[]>([]);
  readonly qty            = signal(1);

  readonly chapterLabel = computed(() => this.i18n.t(this.chapter().ru, this.chapter().pt));
  readonly selectedRule = computed(() => {
    const rules = this.set().rules;
    const id = this.selectedRuleId();
    return rules.find(r => r.id === id) ?? rules[0];
  });
  readonly effectiveMax = computed(() => Math.min(this.mode(), this.selectedRule()?.max_flavors ?? 1));
  readonly atMaxFlavors = computed(() => this.flavorIds().length >= this.effectiveMax());

  constructor() {
    // Default to the first rule when set arrives / changes, and recover if the
    // currently-selected rule disappeared from the catalog.
    effect(() => {
      const rules = this.set().rules;
      const currentId = untracked(() => this.selectedRuleId());
      if (!rules.some(r => r.id === currentId)) {
        this.selectedRuleId.set(rules[0]?.id ?? null);
      }
    });

    // Clamp mode when the selected rule's max_flavors is below current mode
    // (e.g. user switches from eclair-4 to eclair-2).
    effect(() => {
      const max = this.selectedRule()?.max_flavors ?? 1;
      if (untracked(() => this.mode()) > max) this.mode.set(1);
    });
  }

  selectRule(id: string): void {
    this.selectedRuleId.set(id);
    this._resetSelection();
  }

  selectMode(m: 1 | 2): void {
    this.mode.set(m);
    this._resetSelection();
  }

  toggleFlavor(f: Flavor): void {
    this.flavorIds.update(current => {
      const idx = current.indexOf(f.id);
      if (idx >= 0) return current.filter(id => id !== f.id);
      if (current.length >= this.effectiveMax()) return current;
      return [...current, f.id];
    });
  }

  addToCart(): void {
    const ruleId = this.selectedRule()?.id;
    if (!ruleId) return;
    this._cart.add(ruleId, this.flavorIds(), this.qty());
    this._resetSelection();
  }

  private _resetSelection(): void {
    this.flavorIds.set([]);
    this.qty.set(1);
  }
}
