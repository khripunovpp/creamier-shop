import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CartUiService {
  readonly isCartOpen     = signal(false);
  readonly isCheckoutOpen = signal(false);

  openCart():      void { this.isCartOpen.set(true); }
  closeCart():     void { this.isCartOpen.set(false); }

  openCheckout():  void { this.isCheckoutOpen.set(true); }
  closeCheckout(): void { this.isCheckoutOpen.set(false); }

  // Drawer "Checkout" button → close drawer, open checkout modal.
  goCheckout(): void {
    this.isCartOpen.set(false);
    this.isCheckoutOpen.set(true);
  }
}
