import {
  ChangeDetectionStrategy, Component, computed, inject, input, output, signal,
} from '@angular/core';
import { I18nService } from '../../service/services/i18n.service';
import { StockSet } from '../../types/set.type';

@Component({
  selector: 'cmh-order-panel',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let rule = selectedRule();
    @let max = effectiveMaxFlavors();
    @let ready = isReady();

    <div class="order-panel">
      <div class="order-controls">
        @if (set().rules.length > 1) {
          <div>
            <div class="order-grp-lbl">{{ i18n.t('Размер', 'Tamanho') }}</div>
            <div class="order-size-btns">
              @for (r of set().rules; track r.id) {
                <button (click)="ruleSelected.emit(r.id)" [class.order-size-btn--on]="r.id === selectedRuleId()"
                        class="order-size-btn"
                        type="button">{{ r.count }}
                </button>
              }
            </div>
          </div>
        }
        @if (rule.max_flavors > 1) {
          <div>
            <div class="order-grp-lbl">{{ i18n.t('Состав', 'Composição') }}</div>
            <div class="order-mode-btns">
              <button (click)="modeSelected.emit(1)" [class.order-mode-btn--on]="mode() === 1"
                      class="order-mode-btn"
                      type="button">{{ i18n.t('1 вкус', '1 sabor') }}
              </button>
              <button (click)="modeSelected.emit(2)" [class.order-mode-btn--on]="mode() === 2"
                      class="order-mode-btn"
                      type="button">{{ i18n.t('2 вкуса', '2 sabores') }}
              </button>
            </div>
          </div>
        }
        <div>
          <div class="order-grp-lbl">{{ i18n.t('Количество', 'Quantidade') }}</div>
          <div class="order-qty-wrap">
            <button (click)="dec()" class="order-qty-btn" type="button">−</button>
            <span class="order-qty-num">{{ qty() }}</span>
            <button (click)="inc()" class="order-qty-btn" type="button">+</button>
          </div>
        </div>
      </div>

      <div class="order-status">
        {{
          ready
            ? i18n.t('✓ Готово к добавлению в корзину', '✓ Pronto a adicionar')
            : i18n.t('Выберите вкус выше', 'Escolha um sabor acima')
        }}
      </div>

      <div class="order-price-area">
        <div class="price-num price-product">
          {{ currentPrice() }}<span class="price-product-eu"> €</span>
        </div>
        <button (click)="onAddClick(ready, max)" [class.order-add-btn--on]="ready"
                class="order-add-btn"
                type="button">
          {{ i18n.t('Положить в корзину', 'Adicionar ao cesto') }}
        </button>
      </div>
    </div>

    <div [class.toast--show]="toastVisible()" class="toast">{{ toastMsg() }}</div>
  `,
  styles: `
    /* Copied verbatim from .order-* / .price-* / .toast rules in source/sweet-thing-v2.html */
    .order-panel {
      background: var(--cream);
      border-top: 1px solid var(--line);
      padding: 40px 48px;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 40px;
      align-items: center;
    }

    .order-controls {
      display: flex;
      gap: 28px;
      flex-wrap: wrap;
    }

    .order-grp-lbl {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: .18em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 10px;
    }

    .order-size-btns {
      display: flex;
      gap: 6px;
    }

    .order-size-btn {
      width: 48px;
      height: 48px;
      border: 1px solid var(--line);
      background: transparent;
      color: var(--text);
      font-family: var(--f-price);
      font-size: 20px;
      font-weight: 600;
      cursor: pointer;
    }

    .order-size-btn--on {
      border-color: var(--forest);
      background: var(--forest);
      color: var(--cream);
    }

    .order-mode-btns {
      display: flex;
      border: 1px solid var(--line);
    }

    .order-mode-btn {
      padding: 16px 22px;
      border: none;
      background: transparent;
      color: var(--text);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }

    .order-mode-btn--on {
      background: var(--forest);
      color: var(--cream);
    }

    .order-qty-wrap {
      display: flex;
      border: 1px solid var(--line);
      align-items: center;
      height: 48px;
    }

    .order-qty-btn {
      width: 40px;
      height: 100%;
      background: none;
      border: none;
      color: var(--muted);
      font-size: 20px;
      cursor: pointer;
    }

    .order-qty-num {
      width: 36px;
      text-align: center;
      font-family: var(--f-price);
      font-size: 22px;
      font-weight: 600;
      color: var(--text);
    }

    .order-status {
      font-size: 13px;
      color: var(--muted);
      line-height: 1.6;
      justify-self: center;
      max-width: 200px;
      text-align: center;
    }

    .order-price-area {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 12px;
    }

    .order-add-btn {
      padding: 14px 32px;
      background: transparent;
      color: var(--muted);
      border: 1px solid var(--forest);
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .12em;
      text-transform: uppercase;
      cursor: default;
    }

    .order-add-btn--on {
      background: var(--forest);
      color: var(--cream);
      cursor: pointer;
    }

    .price-num {
      font-family: var(--f-price);
      font-weight: 700;
      color: var(--forest);
      line-height: 1;
    }

    .price-product {
      font-size: 52px;
    }

    .price-product-eu {
      font-size: 26px;
    }

    .toast {
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%) translateY(14px);
      background: var(--cream);
      color: var(--forest);
      border: 1.5px solid var(--forest);
      box-shadow: 0 4px 24px rgba(31, 42, 32, .28);
      padding: 13px 28px;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: .06em;
      opacity: 0;
      pointer-events: none;
      transition: opacity .22s ease, transform .22s ease;
      z-index: 600;
      white-space: nowrap;
    }

    .toast--show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    @media (max-width: 767px) {
      .order-panel {
        grid-template-columns: 1fr;
        gap: 20px;
        padding: 24px 20px;
      }
      .order-status {
        justify-self: start;
      }
      .order-price-area {
        align-items: flex-start;
      }
    }
  `,
})
export class OrderPanelComponent {
  readonly i18n = inject(I18nService);

  readonly set            = input.required<StockSet>();
  readonly selectedRuleId = input<string | null>(null);
  readonly mode           = input<1 | 2>(1);
  readonly flavorIds      = input<string[]>([]);
  readonly qty            = input(1);

  readonly ruleSelected = output<string>();
  readonly modeSelected = output<1 | 2>();
  readonly qtyChanged   = output<number>();
  readonly addRequested = output<void>();

  readonly selectedRule = computed(() => {
    const id = this.selectedRuleId();
    const rules = this.set().rules;
    return rules.find(r => r.id === id) ?? rules[0];
  });
  readonly effectiveMaxFlavors = computed(() => Math.min(this.mode(), this.selectedRule().max_flavors));
  readonly isReady             = computed(() => this.flavorIds().length === this.effectiveMaxFlavors());
  readonly currentPrice        = computed(() => this.selectedRule().price * this.qty());

  // Self-contained toast for "select X more flavors" hints.
  readonly toastMsg     = signal('');
  readonly toastVisible = signal(false);
  private _toastTimer: ReturnType<typeof setTimeout> | null = null;

  dec(): void { this.qtyChanged.emit(Math.max(1, this.qty() - 1)); }
  inc(): void { this.qtyChanged.emit(this.qty() + 1); }

  onAddClick(ready: boolean, effectiveMax: number): void {
    if (ready) {
      this.addRequested.emit();
      return;
    }
    const picked = this.flavorIds().length;
    const need = effectiveMax - picked;
    const msg = this.i18n.lang() === 'ru'
      ? (picked === 0
          ? `Выберите ${effectiveMax} ${effectiveMax === 1 ? 'вкус' : 'вкуса'}`
          : `Ещё ${need} ${need === 1 ? 'вкус' : 'вкуса'} — выберите выше`)
      : (picked === 0
          ? `Escolha ${effectiveMax} sabor${effectiveMax > 1 ? 'es' : ''}`
          : `Mais ${need} sabor${need > 1 ? 'es' : ''} — escolha acima`);
    this._showToast(msg);
  }

  private _showToast(msg: string): void {
    this.toastMsg.set(msg);
    this.toastVisible.set(true);
    if (this._toastTimer) clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.toastVisible.set(false), 3000);
  }
}
