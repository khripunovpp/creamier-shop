import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../service/services/i18n.service';

@Component({
  selector: 'cmh-hero',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <div class="hero__top">
        <div>
          <h1 class="hero__h1">
            {{ i18n.t('Тарталетки,', 'Tarteletes,') }}<br/>
            {{ i18n.t('эклеры', 'eclairs') }}<br/>
            &amp; {{ i18n.t('моменты', 'momentos') }}
          </h1>
        </div>
        <div class="hero__intro">
          <div class="hero__line"></div>
          <p class="hero__desc">
            {{ i18n.t(
              'Маленькая мастерская в Порту, где каждое утро рождается четыре композиции вкуса. Никаких компромиссов, никакой массовости — только свежее.',
              'Pequeno atelier no Porto, onde todas as manhãs nascem quatro composições de sabor. Sem compromissos, sem massificação — apenas fresco.'
            ) }}
          </p>
          <div class="hero__cta">
            <span class="hero__dash" aria-hidden="true"></span>
            <button class="hero__cta-btn" (click)="scrollToOrder()">
              {{ i18n.t('Собрать заказ', 'Encomendar agora') }}
            </button>
          </div>
        </div>
      </div>

      <div class="hero__photos">
        <div class="hero__main">
          <div class="hero-photo-wrap">
            <img src="/photos/IMG_0787.JPG" [alt]="i18n.t('Тарталетки', 'Tarteletes')" />
          </div>
          <div class="hero__lbl">{{ i18n.t('свежая клубника', 'morango fresco') }}</div>
        </div>

        <div class="hero__mid">
          <div class="hero-photo-wrap">
            <img src="/photos/IMG_0671.JPG" alt="" loading="lazy" decoding="async" />
          </div>
          <div class="hero__count">
            <span class="hero__count-tag">{{ i18n.t('на заказ', 'por encomenda') }}</span>
            <span class="hero__count-num">
              {{ i18n.t('более 10', 'mais de 10') }}<br/>
              <span class="hero__count-unit">{{ i18n.t('вкусов десертов', 'sabores') }}</span>
            </span>
          </div>
        </div>

        <div class="hero__side">
          <div class="hero-photo-wrap">
            <img src="/photos/IMG_1062.PNG" alt="" class="hero-img--choux" loading="lazy" decoding="async" />
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    /* CSS copied verbatim from source/sweet-thing-v2.html .hero* + .hero-photo-wrap rules */
    .hero {
      padding: 20px 64px 100px;
      background: var(--bg);
    }

    .hero__top {
      display: grid;
      grid-template-columns: 1.15fr .85fr;
      gap: 48px;
      margin-bottom: 32px;
    }

    /* font-size scales smoothly from 52px on narrow screens up to 132px once
       the viewport hits ~1480px. Slope 8.92vw gives exactly 132px at 1480px;
       below that the clamp lets the size track the viewport. */
    .hero__h1 {
      font-family: var(--f-disp);
      font-size: clamp(52px, 8vw, 132px);
      font-weight: 400;
      line-height: .92;
      color: var(--text);
      margin: 0;
      letter-spacing: 0;
    }

    .hero__intro {
      align-self: end;
      padding-bottom: 16px;
    }

    .hero__line {
      width: 60px;
      height: 1px;
      background: var(--text);
      margin-bottom: 20px;
    }

    .hero__desc {
      font-size: 16px;
      color: var(--text);
      line-height: 1.65;
      margin: 0;
    }

    .hero__cta {
      display: flex;
      gap: 8px;
      margin-top: 28px;
      align-items: center;
    }

    .hero__dash {
      width: 22px;
      height: 1px;
      background: var(--text);
      flex-shrink: 0;
    }

    .hero__cta-btn {
      padding: 14px 30px;
      background: var(--forest);
      color: var(--cream);
      border: none;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: .1em;
      text-transform: uppercase;
      cursor: pointer;
    }

    .hero__photos {
      display: grid;
      grid-template-columns: 1.2fr .8fr 1fr;
      gap: 16px;
      height: 460px;
    }

    .hero__main {
      position: relative;
    }

    .hero__lbl {
      position: absolute;
      left: 20px;
      bottom: 20px;
      background: var(--cream);
      padding: 10px 16px;
      font-family: var(--f-disp);
      font-style: italic;
      font-size: 18px;
      color: var(--forest);
    }

    .hero__mid {
      display: grid;
      grid-template-rows: 1fr 1fr;
      gap: 16px;
    }

    .hero__count {
      background: var(--forest);
      color: var(--cream);
      padding: 24px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .hero__count-tag {
      font-family: var(--f-disp);
      font-size: 14px;
      font-style: italic;
      letter-spacing: .1em;
    }

    .hero__count-num {
      font-family: var(--f-disp);
      font-size: 44px;
      line-height: .95;
      margin-top: 12px;
    }

    .hero__count-unit {
      font-size: 16px;
      font-family: var(--f-sans);
      letter-spacing: .18em;
      text-transform: uppercase;
    }

    .hero-photo-wrap {
      position: relative;
      overflow: hidden;
      width: 100%;
      height: 100%;
    }

    .hero-photo-wrap img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
    }

    .hero-img--choux {
      object-fit: cover !important;
      object-position: center;
      transform: scale(1.18);
    }

    @media (max-width: 1023px) {
      .hero__photos {
        grid-template-columns: 1fr 1fr;
      }
      .hero__mid {
        display: none;
      }
    }

    @media (max-width: 767px) {
      .hero {
        padding: 24px 20px 60px;
      }
      .hero__top {
        grid-template-columns: 1fr;
        gap: 24px;
        margin-bottom: 24px;
      }
      .hero__desc {
        font-size: 14px;
      }
      .hero__photos {
        grid-template-columns: 1fr;
        height: auto;
      }
      /* Only the main photo remains on mobile; the side shot is decorative. */
      .hero__side {
        display: none;
      }
      .hero__main {
        height: 320px;
      }
    }
  `,
})
export class HeroComponent {
  readonly i18n = inject(I18nService);

  scrollToOrder(): void {
    document.getElementById('tartlet')?.scrollIntoView({ behavior: 'smooth' });
  }
}
