import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { I18nService, Lang } from '../../service/services/i18n.service';
import { CartService } from '../../service/services/cart.service';
import { CartUiService } from '../../service/services/cart-ui.service';

@Component({
  selector: 'cmh-header',
  imports: [AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="header">
      <div class="header__inner">
        <div class="header__logo">Patissière</div>

        <nav class="header__nav">
          @for (item of nav; track item.id) {
            <a (click)="scrollTo(item.id)" class="header__nav-a">{{ i18n.t(item.ru, item.pt) }}</a>
          }
        </nav>

        <div class="header__right">
          <div class="header__langs">
            @for (l of langs; track l; let i = $index) {
              @if (i > 0) {
                <span class="header__lang-dot">·</span>
              }
              <button (click)="i18n.setLang(l)"
                      [class.header__lang-btn--on]="i18n.lang() === l"
                      class="header__lang-btn">{{ l }}
              </button>
            }
          </div>

          @let count = (cart.count$ | async) ?? 0;
          <button (click)="openCart()" class="header__cart">
            <svg fill="none" height="16" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24" width="16">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6"/>
            </svg>
            {{ count > 0 ? count : i18n.t('Корзина', 'Cesto') }}
            @if (count > 0) {
              <span class="header__cart-badge">{{ count }}</span>
            }
          </button>
        </div>
      </div>
    </header>
  `,
  styles: `
    /* .header keeps the full-width background; .header__inner is the flex row
       that the global max-width rule in styles.scss centers within --container-width. */
    .header {
      padding: 24px 64px;
      background: var(--bg);
    }

    .header__inner {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 40px;
    }

    .header__logo {
      font-family: var(--f-disp);
      font-size: 32px;
      color: var(--forest);
      line-height: 1;
      letter-spacing: .02em;
      flex-shrink: 0;
    }

    .header__nav {
      flex: 1;
      display: flex;
      justify-content: center;
      gap: 48px;
    }

    .header__nav-a {
      font-size: 18px;
      font-weight: 500;
      letter-spacing: .01em;
      color: var(--text);
      text-decoration: none;
      cursor: pointer;
      padding-bottom: 3px;
      border-bottom: 1px solid transparent;
      transition: border-color .2s;
      white-space: nowrap;
    }

    .header__nav-a:hover {
      border-bottom-color: var(--forest);
    }

    .header__right {
      display: flex;
      gap: 20px;
      align-items: center;
      flex-shrink: 0;
    }

    .header__langs {
      display: flex;
      gap: 2px;
      align-items: center;
    }

    .header__lang-dot {
      color: var(--muted);
      font-size: 14px;
      margin: 0 2px;
    }

    .header__lang-btn {
      background: none;
      border: none;
      padding: 4px 8px;
      color: var(--muted);
      text-transform: uppercase;
      font-weight: 400;
      font-size: 15px;
      letter-spacing: .1em;
      cursor: pointer;
    }

    .header__lang-btn--on {
      color: var(--forest);
      font-weight: 700;
      text-decoration: underline;
      text-underline-offset: 4px;
    }

    .header__cart {
      position: relative;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 22px;
      background: var(--cream);
      border: 1px solid var(--line);
      color: var(--text);
      font-size: 15px;
      font-weight: 500;
      letter-spacing: .04em;
      cursor: pointer;
    }

    .header__cart-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 20px;
      height: 20px;
      background: var(--forest);
      color: var(--cream);
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @media (max-width: 767px) {
      .header {
        padding: 16px 20px;
      }
      /* Logo on the left, lang+cart on the right, nav wraps to a second row
         as a horizontal scrolling strip. 40px desktop gap is too wide for a
         375px viewport — collapse it. */
      .header__inner {
        gap: 12px;
        justify-content: space-between;
      }
      .header__logo {
        font-size: 24px;
      }
      .header__nav {
        order: 3;
        width: 100%;
        flex: none;
        justify-content: flex-start;
        gap: 20px;
        overflow-x: auto;
        padding-bottom: 4px;
        flex-wrap: wrap;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      .header__nav::-webkit-scrollbar {
        display: none;
      }
      .header__nav-a {
        font-size: 14px;
      }
      .header__right {
        gap: 12px;
      }
      .header__lang-btn {
        font-size: 13px;
        padding: 2px 4px;
      }
      .header__cart {
        padding: 8px 14px;
        font-size: 13px;
        gap: 6px;
      }
    }
  `,
})
export class HeaderComponent {
  readonly i18n = inject(I18nService);
  readonly cart = inject(CartService);
  private readonly _cartUi = inject(CartUiService);

  readonly langs: Lang[] = ['ru', 'pt'];
  readonly nav = [
    { ru: 'Тарталетки', pt: 'Tarteletes',  id: 'tartlet'  },
    { ru: 'Эклеры',     pt: 'Eclairs',     id: 'eclair'   },
    { ru: 'Отзывы',     pt: 'Testemunhos', id: 'reviews'  },
    { ru: 'Кейтеринг',  pt: 'Catering',    id: 'catering' },
  ];

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  openCart(): void {
    this._cartUi.openCart();
  }
}
