import {
  ChangeDetectionStrategy, Component, computed, inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CartService } from '../../service/services/cart.service';
import { CartUiService } from '../../service/services/cart-ui.service';
import { SetsService } from '../../service/services/sets.service';
import { I18nService } from '../../service/services/i18n.service';
import { Flavor } from '../../types/flavor.type';
import { SetCartItem } from '../../types/set-cart-item.type';

@Component({
  selector: 'cmh-cart-drawer',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (cartUi.isCartOpen()) {
      <div class="cart-overlay">
        <div (click)="cartUi.closeCart()" class="cart-back"></div>
        <div class="cart-panel">
          <div class="cart-hd">
            <div class="cart-hd__title">{{ i18n.t('Ваш заказ', 'O seu pedido') }}</div>
            <button (click)="cartUi.closeCart()" aria-label="Close" class="cart-hd__close" type="button">✕</button>
          </div>

          <div class="cart-body">
            @if (items().length === 0) {
              <div class="cart-empty">
                <div class="cart-empty__ic">∅</div>
                <div class="cart-empty__tx">{{ i18n.t('Корзина пуста', 'Cesto vazio') }}</div>
              </div>
            } @else {
              @for (group of groups(); track group.slug) {
                <div class="cart-group">
                  <div class="cart-section-label">{{ i18n.lang() === 'ru' ? group.name_ru : group.name_pt }}</div>
                  @for (item of group.items; track lineKey(item)) {
                    <div class="cart-item">
                      @for (name of flavorNamesFor(item.flavor_ids); track $index) {
                        <div class="cart-flavor-row">
                          <span class="cart-flavor-name">{{ name }}</span>
                          <span class="cart-flavor-pcs">{{ pcsEach(item) }} {{ i18n.t('шт', 'un') }}</span>
                        </div>
                      }
                      <div class="cart-item-footer">
                        <div class="cart-qty-wrap">
                          <button (click)="dec(item)" class="cart-qty-btn" type="button">−</button>
                          <span class="cart-qty-num">{{ item.quantity }}</span>
                          <button (click)="inc(item)" class="cart-qty-btn" type="button">+</button>
                        </div>
                        <span class="cart-qty-label">{{ boxLabel(item.quantity) }}</span>
                        <span class="price-num price-cart-item">{{ item.price * item.quantity }} €</span>
                        <button (click)="cart.remove(item)" aria-label="Remove" class="cart-remove-btn" type="button">
                          ✕
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            }
          </div>

          @if (items().length > 0) {
            <div class="cart-ft">
              <div class="cart-total-row">
                <span class="cart-total-lbl">{{ i18n.t('Итого', 'Total') }}</span>
                <span class="price-num price-cart-total">{{ sum() }} €</span>
              </div>
              <button (click)="cartUi.goCheckout()" class="cart-checkout-btn" type="button">
                {{ i18n.t('Оформить заказ →', 'Finalizar pedido →') }}
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: `
    /* Copied verbatim from .cart-* rules in source/sweet-thing-v2.html */
    .cart-overlay { position: fixed; inset: 0; z-index: 200; display: flex; }
    .cart-back { flex: 1; background: rgba(31,42,32,.38); }
    .cart-panel { width: 420px; max-width: 100%; background: var(--bg2); display: flex;
                  flex-direction: column; box-shadow: -6px 0 32px rgba(31,42,32,.18); }
    .cart-hd { padding: 24px 28px; border-bottom: 1px solid var(--line);
               display: flex; justify-content: space-between; align-items: center;
               background: var(--cream); flex-shrink: 0; }
    .cart-hd__title { font-family: var(--f-disp); font-size: 28px; color: var(--forest); }
    .cart-hd__close { background: none; border: none; color: var(--muted);
                      font-size: 20px; line-height: 1; cursor: pointer; }
    .cart-body { flex: 1; overflow-y: auto; padding: 20px 22px; }
    .cart-empty { text-align: center; padding-top: 80px; }
    .cart-empty__ic { font-family: var(--f-disp); font-style: italic; font-size: 40px;
                      color: var(--muted); margin-bottom: 12px; }
    .cart-empty__tx { font-size: 14px; color: var(--muted); }
    .cart-ft { padding: 22px 28px; border-top: 1px solid var(--line);
               background: var(--cream); flex-shrink: 0; }
    .cart-total-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
    .cart-total-lbl { font-size: 11px; font-weight: 600; text-transform: uppercase;
                      letter-spacing: .18em; color: var(--muted); }
    .cart-checkout-btn { width: 100%; padding: 16px; background: var(--forest); color: var(--cream);
                         border: none; font-size: 12px; font-weight: 600;
                         letter-spacing: .14em; text-transform: uppercase; cursor: pointer; }
    .cart-group { margin-bottom: 16px; }
    .cart-section-label { font-size: 13px; font-weight: 700; letter-spacing: .18em;
                          text-transform: uppercase; color: var(--forest); margin-bottom: 14px; padding-left: 2px; }
    .cart-item { background: var(--bg2); border: 1px solid var(--line);
                 padding: 16px 18px; margin-bottom: 10px; }
    .cart-flavor-row { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .cart-flavor-name { flex: 1; font-size: 13px; font-weight: 500; color: var(--text); line-height: 1.3; }
    .cart-flavor-pcs { font-size: 12px; color: var(--muted); }
    .cart-item-footer { display: flex; align-items: center; gap: 10px;
                        margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line); }
    .cart-qty-wrap { display: inline-flex; border: 1px solid var(--line); align-items: center; }
    .cart-qty-btn { width: 30px; height: 30px; background: none; border: none;
                    color: var(--text); font-size: 16px; cursor: pointer; }
    .cart-qty-num { width: 24px; text-align: center; font-family: var(--f-price);
                    font-size: 18px; font-weight: 600; color: var(--text); }
    .cart-qty-label { flex: 1; font-size: 12px; color: var(--muted); }
    .cart-remove-btn { background: none; border: none; color: var(--muted);
                       font-size: 16px; padding: 4px 0 4px 8px; line-height: 1; cursor: pointer; }
    .price-num { font-family: var(--f-price); font-weight: 700; color: var(--forest); line-height: 1; }
    .price-cart-item { font-size: 20px; margin-left: auto; }
    .price-cart-total { font-size: 44px; }
  `,
})
export class CartDrawerComponent {
  readonly cart   = inject(CartService);
  readonly cartUi = inject(CartUiService);
  readonly i18n   = inject(I18nService);
  private readonly _sets = inject(SetsService);

  readonly items = toSignal(this.cart.cart$, { initialValue: [] });
  readonly sum   = toSignal(this.cart.sum$,  { initialValue: 0 });
  private readonly _setsSig = toSignal(this._sets.sets$, { initialValue: [] });

  // O(1) lookup from flavor_id → Flavor (across all sets).
  private readonly _flavorsById = computed(() => {
    const map = new Map<string, Flavor>();
    for (const s of this._setsSig()) {
      for (const f of s.items) map.set(f.id, f);
    }
    return map;
  });

  // Cart lines bucketed by set_slug, ordered by the set's position in the catalog.
  readonly groups = computed(() => {
    const list = this.items();
    if (!list.length) return [];
    const bySlug = new Map<string, SetCartItem[]>();
    for (const i of list) {
      const arr = bySlug.get(i.set_slug) ?? [];
      arr.push(i);
      bySlug.set(i.set_slug, arr);
    }
    return this._setsSig()
      .filter(s => bySlug.has(s.slug))
      .map(s => ({
        slug: s.slug,
        name_ru: s.name_ru,
        name_pt: s.name_pt,
        items: bySlug.get(s.slug)!,
      }));
  });

  lineKey(item: SetCartItem): string {
    return item.stock_set_rule_id + ':' + item.flavor_ids.join(',');
  }

  pcsEach(item: SetCartItem): number {
    return Math.floor(item.count / Math.max(1, item.flavor_ids.length));
  }

  flavorNamesFor(ids: string[]): string[] {
    const map = this._flavorsById();
    return ids.map(id => {
      const f = map.get(id);
      return f ? this.i18n.pick(f, 'name') : id;
    });
  }

  inc(item: SetCartItem): void { this.cart.setQuantity(item, item.quantity + 1); }
  dec(item: SetCartItem): void { this.cart.setQuantity(item, item.quantity - 1); }

  boxLabel(qty: number): string {
    if (this.i18n.lang() === 'ru') {
      const tail = qty % 10;
      const teen = qty % 100 >= 11 && qty % 100 <= 14;
      if (teen || tail === 0 || tail >= 5) return 'коробок';
      if (tail === 1) return 'коробка';
      return 'коробки';
    }
    return qty === 1 ? 'caixa' : 'caixas';
  }
}
