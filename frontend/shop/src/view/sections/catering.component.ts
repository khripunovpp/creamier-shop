import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../service/services/i18n.service';

@Component({
  selector: 'cmh-catering',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="catering" id="catering">
      <div class="catering__grid">
        <div>
          <h2 class="catering__title">{{ i18n.t('Кейтеринг', 'Catering') }}</h2>
        </div>
        <div>
          <p class="catering__desc">
            {{
              i18n.t(
                'Оформление мероприятий и корпоративных заказов. Тарталетки и эклеры для вашего события — индивидуально, свежо и точно в срок.',
                'Serviço de catering para eventos e encomendas corporativas. Tarteletes e éclairs para o seu evento — personalizados, frescos e pontuais.'
              )
            }}
          </p>
          <button class="catering__btn" type="button">{{ i18n.t('Написать нам', 'Contactar') }}</button>
        </div>
      </div>
    </section>
  `,
  styles: `
    /* Copied verbatim from .catering* rules in source/sweet-thing-v2.html */
    .catering { background: var(--forest); color: var(--cream); padding: 120px 64px; }
    .catering__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
    .catering__title { font-family: var(--f-disp); font-size: 96px; font-weight: 400;
                       line-height: .95; color: var(--cream); margin: 0; }
    .catering__desc { font-size: 17px; color: var(--cream); line-height: 1.75;
                      margin: 0 0 40px; opacity: .88; }
    .catering__btn { padding: 16px 36px; background: transparent;
                     border: 1px solid var(--cream); color: var(--cream);
                     font-size: 13px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase;
                     cursor: pointer; }
    @media (max-width: 1023px) {
      .catering__title { font-size: 72px; }
      .catering__desc { font-size: 15px; }
    }
    @media (max-width: 767px) {
      .catering { padding: 64px 20px; }
      .catering__grid { grid-template-columns: 1fr; gap: 32px; }
      .catering__title { font-size: 60px; }
    }
  `,
})
export class CateringComponent {
  readonly i18n = inject(I18nService);
}
