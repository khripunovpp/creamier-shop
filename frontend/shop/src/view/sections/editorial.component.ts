import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../service/services/i18n.service';

@Component({
  selector: 'cmh-editorial',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ed">
      <div class="ed__grid">
        <div>
          <div class="ed__eyebrow">{{ i18n.t('Журнал · Заметки шефа', 'Diário · Notas do chef') }}</div>
          <h2 class="ed__title">{{ i18n.t('О сезонности', 'Sobre sazonalidade') }}</h2>
        </div>
        <div>
          <p class="ed__quote">
            {{
              i18n.t(
                '«В мае — клубника, в июле — манго, в октябре — груша и пекан. Мы не делаем то, чего нет на рынке сегодня утром.»',
                '“Em maio — morango, em julho — manga, em outubro — pera e pecã. Não fazemos aquilo que não está no mercado esta manhã.”'
              )
            }}
          </p>
          <div class="ed__attr">— Marina, chef pâtissière</div>
        </div>
      </div>
    </section>
  `,
  styles: `
    /* Copied verbatim from .ed* rules in source/sweet-thing-v2.html */
    .ed { background: var(--forest); color: var(--cream); padding: 120px 64px; }
    .ed__grid { display: grid; grid-template-columns: .9fr 1.2fr; gap: 80px; align-items: center; }
    .ed__eyebrow { font-size: 12px; font-weight: 600; letter-spacing: .22em;
                   text-transform: uppercase; opacity: .7; margin-bottom: 24px; }
    .ed__title { font-family: var(--f-disp); font-size: 80px; font-weight: 400;
                 line-height: .95; margin: 0; color: var(--cream); }
    .ed__quote { font-family: var(--f-disp); font-style: italic; font-size: 28px;
                 line-height: 1.45; margin: 0; opacity: .95; }
    .ed__attr { margin-top: 32px; font-size: 13px; letter-spacing: .18em;
                text-transform: uppercase; opacity: .7; }
    @media (max-width: 1023px) {
      .ed__title { font-size: 64px; }
      .ed__quote { font-size: 22px; }
    }
    @media (max-width: 767px) {
      .ed { padding: 64px 20px; }
      .ed__grid { grid-template-columns: 1fr; gap: 32px; }
      .ed__title { font-size: 48px; }
      .ed__quote { font-size: 20px; }
    }
  `,
})
export class EditorialComponent {
  readonly i18n = inject(I18nService);
}
