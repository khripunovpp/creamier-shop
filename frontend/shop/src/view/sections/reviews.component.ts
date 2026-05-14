import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {I18nService} from '../../service/services/i18n.service';

interface Review {
  text_ru: string;
  text_pt: string;
  name: string;
  detail_ru: string;
  detail_pt: string;
}

const REVIEWS: Review[] = [
  {
    text_ru: '«Заказывала тарталетки с фисташкой на день рождения — гости были в восторге. Вкус настоящий, не приторный.»',
    text_pt: '«Encomendei tarteletes de pistácio para o aniversário — os convidados ficaram encantados. Sabor verdadeiro, não enjoativo.»',
    name: 'Анна К.',
    detail_ru: 'клубника с фисташкой × 4',
    detail_pt: 'morango com pistácio × 4',
  },
  {
    text_ru: '«Эклеры с тонка — это отдельная история. Берём каждую неделю. Упаковка тоже красивая.»',
    text_pt: '«Os éclairs com tonka são uma história à parte. Compramos todas as semanas. A embalagem também é bonita.»',
    name: 'Михаил Р.',
    detail_ru: 'шоколад с бобом тонка × 2',
    detail_pt: 'chocolate com fava tonka × 2',
  },
  {
    text_ru: '«Долго искала кондитерскую без лишнего сахара. Нашла. Крем дипломат просто идеальный.»',
    text_pt: '«Procurei muito uma pastelaria que não abuse do açúcar. Encontrei. O creme diplomata é simplesmente perfeito.»',
    name: 'Sofia M.',
    detail_ru: 'ваниль с манго × 4',
    detail_pt: 'baunilha com manga × 4',
  },
];

@Component({
  selector: 'cmh-reviews',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section id="reviews" class="reviews">
      <div class="reviews__head">
        <div>
          <div class="reviews__eyebrow">❋ {{ i18n.t('Отзывы', 'Testemunhos') }}</div>
          <h2 class="reviews__title">{{ i18n.t('Говорят клиенты', 'O que dizem') }}</h2>
        </div>
        <div class="reviews__loc">Porto · 2024–2025</div>
      </div>
      <div class="reviews__grid">
        @for (r of reviews; track r.name; let i = $index) {
          <div class="rcard" [class.rcard--dark]="i === 1">
            <div>
              <div class="rcard__mark">"</div>
              <p class="rcard__text">{{ i18n.pick(r, 'text') }}</p>
            </div>
            <div class="rcard__foot">
              <div class="rcard__name">{{ r.name }}</div>
              <div class="rcard__detail">{{ i18n.pick(r, 'detail') }}</div>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    /* Copied verbatim from .reviews* / .rcard* rules in source/sweet-thing-v2.html */
    .reviews {
      background: var(--bg);
      padding: 56px 64px 120px;
    }

    .reviews__head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 56px;
      gap: 16px;
      flex-wrap: wrap;
    }

    .reviews__eyebrow {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .22em;
      text-transform: uppercase;
      color: var(--forest);
      margin-bottom: 20px;
    }

    .reviews__title {
      font-family: var(--f-disp);
      font-size: 80px;
      font-weight: 400;
      line-height: .95;
      color: var(--text);
      margin: 0;
    }

    .reviews__loc {
      font-family: var(--f-disp);
      font-style: italic;
      font-size: 20px;
      color: var(--muted);
      padding-bottom: 8px;
    }

    .reviews__grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2px;
    }

    .rcard {
      padding: 48px 40px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 340px;
      background: var(--cream);
    }

    .rcard--dark {
      background: var(--forest);
    }

    .rcard__mark {
      font-family: var(--f-disp);
      font-size: 72px;
      color: var(--forest);
      line-height: .7;
      margin-bottom: 20px;
      opacity: .25;
    }

    .rcard--dark .rcard__mark {
      color: var(--cream);
    }

    .rcard__text {
      font-family: var(--f-disp);
      font-style: italic;
      font-size: 20px;
      line-height: 1.6;
      color: var(--text);
      margin: 0;
    }

    .rcard--dark .rcard__text {
      color: var(--cream);
    }

    .rcard__foot {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid var(--line);
    }

    .rcard--dark .rcard__foot {
      border-top-color: rgba(248, 241, 220, .2);
    }

    .rcard__name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
    }

    .rcard--dark .rcard__name {
      color: var(--cream);
    }

    .rcard__detail {
      font-size: 12px;
      color: var(--muted);
      margin-top: 4px;
      letter-spacing: .04em;
    }

    .rcard--dark .rcard__detail {
      color: rgba(248, 241, 220, .55);
    }

    @media (max-width: 1023px) {
      .reviews__title {
        font-size: 64px;
      }
      .reviews__grid {
        grid-template-columns: 1fr 1fr;
      }
      .reviews__loc {
        display: none;
      }
    }

    @media (max-width: 767px) {
      .reviews {
        padding: 48px 20px 64px;
      }
      .reviews__head {
        margin-bottom: 32px;
      }
      .reviews__title {
        font-size: 48px;
      }
      .reviews__grid {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .rcard {
        padding: 32px 24px;
        min-height: auto;
      }
      .rcard__text {
        font-size: 17px;
      }
    }
  `,
})
export class ReviewsComponent {
  readonly i18n = inject(I18nService);
  readonly reviews = REVIEWS;
}
