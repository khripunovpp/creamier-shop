import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'cmh-product-section-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-busy="true" aria-live="polite" class="skeleton">
      <div class="skeleton__head">
        <div>
          <div class="bone bone--chapter"></div>
          <div class="bone bone--title"></div>
        </div>
        <div class="skeleton__desc">
          <div class="bone bone--text"></div>
          <div class="bone bone--text"></div>
          <div class="bone bone--text bone--text-short"></div>
        </div>
      </div>

      <div class="skeleton__box">
        <div class="skeleton__bhead">
          <div class="bone bone--btitle"></div>
          <div class="skeleton__nav">
            <div class="bone bone--nbtn"></div>
            <div class="bone bone--nbtn"></div>
          </div>
        </div>

        <div class="skeleton__cards">
          @for (_ of placeholders; track $index) {
            <div class="skeleton__card">
              <div class="bone bone--img"></div>
              <div class="bone bone--ctitle"></div>
              <div class="bone bone--cdetail"></div>
            </div>
          }
        </div>

        <div class="skeleton__panel">
          <div class="skeleton__controls">
            <div class="bone bone--ctrl"></div>
            <div class="bone bone--ctrl"></div>
          </div>
          <div class="bone bone--status"></div>
          <div class="skeleton__price">
            <div class="bone bone--price"></div>
            <div class="bone bone--btn"></div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host { display: block; }

    .skeleton { background: var(--bg); padding: 100px 64px; }

    /* Mirror the global rule in styles.scss that caps real .product__head /
       .product__box at --container-width — without it the skeleton would
       stretch edge-to-edge while the real section doesn't. */
    .skeleton__head,
    .skeleton__box { max-width: var(--container-width); margin-left: auto; margin-right: auto; }

    .skeleton__head { display: grid; grid-template-columns: 1fr 1fr; gap: 60px;
                      margin-bottom: 64px; align-items: end; }
    .skeleton__desc { max-width: 480px; }

    .skeleton__box { border: 1px solid var(--line); }

    .skeleton__bhead { display: flex; justify-content: space-between; align-items: center;
                       padding: 20px 32px; border-bottom: 1px solid var(--line); }
    .skeleton__nav { display: flex; gap: 10px; }

    .skeleton__cards { padding: 32px 28px 24px; display: grid; gap: 28px;
                       grid-template-columns: repeat(4, 1fr); }
    .skeleton__card { display: flex; flex-direction: column; }

    .skeleton__panel { padding: 40px 48px; display: grid; gap: 40px;
                       grid-template-columns: auto 1fr auto; align-items: center;
                       border-top: 1px solid var(--line); background: var(--cream); }
    .skeleton__controls { display: flex; gap: 28px; }
    .skeleton__price { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }

    .bone { background: linear-gradient(90deg,
              rgba(0,0,0,.06) 0%, rgba(0,0,0,.12) 50%, rgba(0,0,0,.06) 100%);
            background-size: 200% 100%;
            animation: shimmer 1.4s ease-in-out infinite;
            border-radius: 3px; }

    .bone--chapter   { width: 120px; height: 12px; margin-bottom: 24px; }
    .bone--title     { width: 70%; max-width: 380px; height: 88px; }
    .bone--text      { width: 100%; height: 14px; margin-bottom: 10px; }
    .bone--text-short { width: 55%; }

    .bone--btitle    { width: 220px; height: 22px; }
    .bone--nbtn      { width: 44px; height: 44px; border-radius: 0; }

    .bone--img       { aspect-ratio: 1/1; width: 100%; margin-bottom: 14px; border-radius: 0; }
    .bone--ctitle    { width: 80%; height: 22px; margin-bottom: 8px; }
    .bone--cdetail   { width: 60%; height: 12px; }

    .bone--ctrl      { width: 140px; height: 48px; border-radius: 0; }
    .bone--status    { width: 160px; height: 14px; margin: 0 auto; }
    .bone--price     { width: 120px; height: 48px; }
    .bone--btn       { width: 200px; height: 42px; border-radius: 0; }

    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    @media (max-width: 1023px) {
      .skeleton__cards { grid-template-columns: repeat(2, 1fr); }
      /* Real carousel shows 2 cards per view on tablet — hide the rest so the
         skeleton matches the visible viewport instead of stacking placeholders. */
      .skeleton__card:nth-child(n+3) { display: none; }
      .bone--title { height: 64px; }
    }
    @media (max-width: 767px) {
      .skeleton { padding: 60px 20px; }
      .skeleton__head { grid-template-columns: 1fr; gap: 16px; margin-bottom: 32px; }
      .skeleton__bhead { padding: 16px 20px; }
      .skeleton__cards { padding: 24px 20px; grid-template-columns: 1fr; gap: 20px; }
      /* Real carousel shows just 1 card on mobile. */
      .skeleton__card:nth-child(n+2) { display: none; }
      .skeleton__panel { grid-template-columns: 1fr; gap: 20px; padding: 24px 20px; }
      .skeleton__controls { flex-wrap: wrap; gap: 16px; }
      .skeleton__price { align-items: flex-start; }
      .bone--title    { height: 48px; }
      .bone--btitle   { width: 60%; }
      .bone--ctrl     { width: 100%; max-width: 200px; height: 44px; }
      .bone--status   { margin: 0; }
      .bone--price    { height: 38px; }
      .bone--btn      { width: 100%; max-width: 240px; }
    }
  `,
})
export class ProductSectionSkeletonComponent {
  readonly placeholders = Array.from({ length: 4 });
}
