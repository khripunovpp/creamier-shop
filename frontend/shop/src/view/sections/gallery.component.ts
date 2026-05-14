import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../service/services/i18n.service';

const ROW1 = [
  '/photos/IMG_0284.JPG',
  '/photos/IMG_0787.JPG',
  '/photos/55D93CEC-5533-4E58-91C1-CDC874500DFF.JPG',
  '/photos/IMG_1008.JPG',
  '/photos/IMG_1013.JPG',
  '/photos/DF987CD6-5971-4D9D-88A0-0EF1E71177AD.JPG',
  '/photos/IMG_1062.PNG',
  '/photos/5EB830D0-D35C-4911-A4DF-EB0EC3B618CD.JPG',
  '/photos/451AD1D8-94C3-493C-B6EC-88E2E30AFA55.JPG',
];

const ROW2 = [
  '/photos/IMG_0671.JPG',
  '/photos/F169D37B-8F34-4442-8C2D-CD96C2038C2F.JPG',
  '/photos/IMG_1010.JPG',
  '/photos/IMG_1009.JPG',
  '/photos/EF50BD5B-5FFC-4ADE-B208-2598C6C18D05.JPG',
  '/photos/IMG_1058.PNG',
  '/photos/IMG_0156.JPG',
  '/photos/IMG_1007.JPG',
  '/photos/IMG_1014.JPG',
];

@Component({
  selector: 'cmh-gallery',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="gallery">
      <div class="gallery__head">
        <div class="gallery__eyebrow">❋ {{ i18n.t('Галерея', 'Galeria') }}</div>
        <h2 class="gallery__title">{{ i18n.t('Наши изделия', 'Nossas criações') }}</h2>
      </div>
      <div class="gallery__rows">
        <div class="gallery__row gallery__row--fwd">
          @for (src of row1; track $index) {
            <div class="gallery__item"><img [src]="src" alt="" loading="lazy" decoding="async" /></div>
          }
        </div>
        <div class="gallery__row gallery__row--rev">
          @for (src of row2; track $index) {
            <div class="gallery__item"><img [src]="src" alt="" loading="lazy" decoding="async" /></div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    /* Copied verbatim from .gallery* + @keyframes rules in source/sweet-thing-v2.html */
    @keyframes gallerySlideFwd {
      from {
        transform: translateX(0);
      }
      to {
        transform: translateX(-50%);
      }
    }

    @keyframes gallerySlideRev {
      from {
        transform: translateX(-50%);
      }
      to {
        transform: translateX(0);
      }
    }

    .gallery {
      background: var(--bg2);
      padding: 100px 64px;
      overflow: hidden;
    }

    .gallery__head {
      margin-bottom: 48px;
    }

    .gallery__eyebrow {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: .22em;
      text-transform: uppercase;
      color: var(--forest);
      margin-bottom: 20px;
    }

    .gallery__title {
      font-family: var(--f-disp);
      font-size: 80px;
      font-weight: 400;
      line-height: .95;
      color: var(--text);
      margin: 0;
    }

    .gallery__rows {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .gallery__row {
      display: flex;
      gap: 12px;
      width: max-content;
      will-change: transform;
    }

    .gallery__row--fwd {
      animation: gallerySlideFwd 50s linear infinite;
    }

    .gallery__row--rev {
      animation: gallerySlideRev 55s linear infinite;
    }

    .gallery__rows:hover .gallery__row {
      animation-play-state: paused;
    }

    .gallery__item {
      width: 260px;
      height: 320px;
      flex-shrink: 0;
      overflow: hidden;
    }

    .gallery__item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform .4s;
    }

    .gallery__item:hover img {
      transform: scale(1.06);
    }

    @media (max-width: 767px) {
      .gallery__head {
        padding: 0 20px;
      }
      .gallery__title {
        font-size: 48px;
      }
      .gallery__item {
        width: 200px;
        height: 250px;
      }
    }
  `,
})
export class GalleryComponent {
  readonly i18n = inject(I18nService);
  // Each row is duplicated so the slide animation can loop seamlessly across the seam.
  readonly row1 = [...ROW1, ...ROW1];
  readonly row2 = [...ROW2, ...ROW2];
}
