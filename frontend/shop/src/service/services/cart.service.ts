import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map } from 'rxjs';
import { SetCartItem } from '../../types/set-cart-item.type';
import { SetsService } from './sets.service';

const STORAGE_KEY = 'cart';

// A cart line is uniquely identified by (stock_set_rule_id + sorted flavor_ids).
// Two boxes of the same rule with different flavor combos are separate lines.
function lineKey(item: Pick<SetCartItem, 'stock_set_rule_id' | 'flavor_ids'>): string {
  return item.stock_set_rule_id + ':' + item.flavor_ids.join(',');
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _setsService = inject(SetsService);

  private readonly _cart$ = new BehaviorSubject<SetCartItem[]>([]);

  readonly cart$ = this._cart$.asObservable();
  readonly count$ = this.cart$.pipe(map(c => c.reduce((s, l) => s + l.quantity, 0)));
  readonly sum$   = this.cart$.pipe(map(c => c.reduce((s, l) => s + l.price * l.quantity, 0)));

  constructor() {
    // Re-hydrate whenever the catalog refreshes so display fields (price, name,
    // count) follow whatever admin has changed since the cart was persisted.
    this._setsService.sets$.subscribe(() => this._hydrateFromStorage());
  }

  add(stock_set_rule_id: string, flavor_ids: string[], quantity = 1): void {
    const lookup = this._setsService.findRuleById(stock_set_rule_id);
    if (!lookup) return;

    const sortedFlavors = [...flavor_ids].sort();
    const next = this._cart$.value.slice();
    const key = lineKey({ stock_set_rule_id, flavor_ids: sortedFlavors });
    const idx = next.findIndex(l => lineKey(l) === key);

    if (idx >= 0) {
      next[idx] = { ...next[idx], quantity: next[idx].quantity + quantity };
    } else {
      next.push({
        stock_set_rule_id,
        flavor_ids: sortedFlavors,
        quantity,
        set_slug: lookup.set.slug,
        set_name_ru: lookup.set.name_ru,
        set_name_pt: lookup.set.name_pt,
        count: lookup.rule.count,
        price: lookup.rule.price,
      });
    }

    this._emit(next);
  }

  setQuantity(line: SetCartItem, quantity: number): void {
    if (quantity <= 0) return this.remove(line);
    const next = this._cart$.value.map(l =>
      lineKey(l) === lineKey(line) ? { ...l, quantity } : l
    );
    this._emit(next);
  }

  remove(line: SetCartItem): void {
    this._emit(this._cart$.value.filter(l => lineKey(l) !== lineKey(line)));
  }

  clear(): void {
    this._emit([]);
  }

  // Body for POST /api/orders/create. Drops display fields.
  toOrderItems(): { stock_set_rule_id: string; flavor_ids: string[]; quantity: number }[] {
    return this._cart$.value.map(({ stock_set_rule_id, flavor_ids, quantity }) =>
      ({ stock_set_rule_id, flavor_ids, quantity }));
  }

  private _emit(next: SetCartItem[]): void {
    this._cart$.next(next);
    this._persist(next);
  }

  private _persist(next: SetCartItem[]): void {
    try {
      const wire = next.map(({ stock_set_rule_id, flavor_ids, quantity }) =>
        ({ stock_set_rule_id, flavor_ids, quantity }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wire));
    } catch {}
  }

  private _hydrateFromStorage(): void {
    let raw: string | null = null;
    try { raw = localStorage.getItem(STORAGE_KEY); } catch { return; }
    if (!raw) return;

    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return; }
    if (!Array.isArray(parsed)) return;

    const hydrated: SetCartItem[] = [];
    for (const entry of parsed) {
      if (
        !entry || typeof entry !== 'object'
        || typeof (entry as any).stock_set_rule_id !== 'string'
        || !Array.isArray((entry as any).flavor_ids)
        || typeof (entry as any).quantity !== 'number'
      ) continue;

      const lookup = this._setsService.findRuleById((entry as any).stock_set_rule_id);
      if (!lookup) continue; // rule no longer exists — drop the line silently

      hydrated.push({
        stock_set_rule_id: (entry as any).stock_set_rule_id,
        flavor_ids: [...(entry as any).flavor_ids].sort(),
        quantity: Math.max(1, Math.floor((entry as any).quantity)),
        set_slug: lookup.set.slug,
        set_name_ru: lookup.set.name_ru,
        set_name_pt: lookup.set.name_pt,
        count: lookup.rule.count,
        price: lookup.rule.price,
      });
    }
    this._cart$.next(hydrated);
  }
}
