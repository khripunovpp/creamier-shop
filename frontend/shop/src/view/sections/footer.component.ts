import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../service/services/i18n.service';

@Component({
  selector: 'cmh-footer',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer">
      <div class="footer__grid">
        <div class="footer__logo-col">
          <div class="footer__logo">Patissière</div>
          <p class="footer__desc">
            {{
              i18n.t(
                'Маленькая мастерская в Порту. Тарталетки и эклеры на заказ — каждое утро свежие.',
                'Pequeno atelier no Porto. Tarteletes e éclairs por encomenda — frescos todas as manhãs.'
              )
            }}
          </p>
        </div>
        <div>
          <div class="footer__col-h">{{ i18n.t('Меню', 'Menu') }}</div>
          <div class="footer__col-i">{{ i18n.t('Тарталетки', 'Tarteletes') }}</div>
          <div class="footer__col-i">{{ i18n.t('Эклеры', 'Eclairs') }}</div>
        </div>
        <div>
          <div class="footer__col-h">{{ i18n.t('Найти нас', 'Visitar') }}</div>
          <div class="footer__col-i">Rua das Flores, Porto</div>
          <div class="footer__col-i">Ter — Sáb · 10—19</div>
        </div>
        <div>
          <div class="footer__col-h">{{ i18n.t('Связь', 'Contacto') }}</div>
          <div class="footer__col-i">hello&#64;patissiere.pt</div>
          <div class="footer__col-i">&#64;patissiere.porto</div>
        </div>
      </div>
      <div class="footer__bot">
        <span>© 2026 Patissière</span>
        <span class="footer__tag">{{ i18n.t('Сделано с любовью в Порту', 'Feito com amor no Porto') }}</span>
      </div>
    </footer>
  `,
  styles: `
    /* Copied verbatim from .footer* rules in source/sweet-thing-v2.html */
    .footer { background: var(--bg2); padding: 80px 64px 32px; }
    .footer__grid { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1fr;
                    gap: 48px; margin-bottom: 56px; }
    .footer__logo { font-family: var(--f-disp); font-size: 48px; color: var(--forest); line-height: 1; }
    .footer__desc { font-size: 14px; color: var(--muted); line-height: 1.7; margin-top: 20px; max-width: 300px; }
    .footer__col-h { font-size: 11px; font-weight: 600; letter-spacing: .18em;
                     text-transform: uppercase; color: var(--forest); margin-bottom: 16px; }
    .footer__col-i { font-size: 14px; color: var(--text); line-height: 1.9; }
    .footer__bot { padding-top: 24px; border-top: 1px solid var(--line);
                   display: flex; flex-wrap: wrap; justify-content: space-between;
                   gap: 8px; font-size: 12px; color: var(--muted); }
    .footer__tag { font-family: var(--f-disp); font-style: italic; font-size: 16px; color: var(--forest); }
    @media (max-width: 1023px) {
      .footer__grid { grid-template-columns: 1fr 1fr 1fr; }
    }
    @media (max-width: 767px) {
      .footer { padding: 48px 20px 24px; }
      .footer__grid { grid-template-columns: 1fr 1fr; gap: 24px 16px; }
      .footer__logo-col { grid-column: 1 / -1; }
      .footer__logo { font-size: 36px; }
      .footer__desc { margin-top: 16px; }
    }
  `,
})
export class FooterComponent {
  readonly i18n = inject(I18nService);
}
