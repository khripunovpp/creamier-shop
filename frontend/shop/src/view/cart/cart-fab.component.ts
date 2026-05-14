import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {CartService} from '../../service/services/cart.service';
import {CartUiService} from '../../service/services/cart-ui.service';

@Component({
  selector: 'cmh-cart-fab',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <button class="cart-fab" type="button" (click)="cartUi.openCart()" aria-label="Open cart">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6"/>
        </svg>
        <span class="cart-fab__badge">{{ count() }}</span>
      </button>
    }
  `,
  styles: `
    /* Copied verbatim from .cart-fab* rules in source/sweet-thing-v2.html */
    .cart-fab {
      position: fixed;
      bottom: 32px;
      right: 32px;
      z-index: 150;
      width: 60px;
      height: 60px;
      background: var(--forest);
      color: var(--cream);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(31, 42, 32, .38);
      transition: transform .2s ease, box-shadow .2s ease;
    }

    .cart-fab:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 28px rgba(31, 42, 32, .48);
    }

    .cart-fab__badge {
      position: absolute;
      top: -7px;
      right: -7px;
      width: 22px;
      height: 22px;
      background: var(--cream);
      color: var(--forest);
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid var(--forest);
    }

    @media (max-width: 767px) {
      .cart-fab {
        bottom: 20px;
        right: 20px;
        width: 52px;
        height: 52px;
      }
    }
  `,
})
export class CartFabComponent {
  readonly cartUi = inject(CartUiService);
  // FAB hidden when cart drawer / checkout modal are open, or when cart is empty.
  readonly visible = computed(() =>
    this.count() > 0 && !this.cartUi.isCartOpen() && !this.cartUi.isCheckoutOpen()
  );
  private readonly _cart = inject(CartService);
  readonly count = toSignal(this._cart.count$, {initialValue: 0});
}
