import {ChangeDetectionStrategy, Component, computed, inject, input, output,} from '@angular/core';
import {I18nService} from '../../service/services/i18n.service';
import {Flavor} from '../../types/flavor.type';

// Pastel palette from the template (FL_PAL). Cards cycle through it by index.
const PALETTE = [
  {bg: '#F4E8D7', line: '#D9C9A9'},
  {bg: '#EFE4D0', line: '#CFB78B'},
  {bg: '#E8DDC4', line: '#C9AE7E'},
  {bg: '#F0E6CF', line: '#D6BC8B'},
];

@Component({
  selector: 'cmh-flavor-card',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let f = flavor();
    @let p = palette();
    @let tags = i18n.lang() === 'ru' ? f.tags_ru : f.tags_pt;
    @let isDisabled = disabled() && !selected();

    <button
      type="button"
      class="fc"
      [class.fc--dis]="isDisabled"
      [disabled]="isDisabled"
      (click)="cardClick.emit()">
      <div class="fc__thumb" [style.--card-bg]="p.bg">
        @if (f.photo_url) {
          <img [src]="f.photo_url" [alt]="i18n.pick(f, 'name')" class="fc__photo"
               loading="lazy" decoding="async"/>
        } @else {
          <div class="photo-slot">
            <span class="photo-slot__lbl">{{ i18n.pick(f, 'name') }}</span>
          </div>
        }
        <div class="fc__num">{{ numberLabel() }}</div>
        @if (selected()) {
          <div class="fc__sel-ring">
            <div class="fc__check">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
        }
      </div>
      <div class="fc__title">{{ i18n.pick(f, 'name') }}</div>
      @if (i18n.pick(f, 'detail')) {
        <div class="fc__detail">{{ i18n.pick(f, 'detail') }}</div>
      }
      @if (tags?.length) {
        <div class="fc__tags">
          @for (t of tags; track t) {
            <span class="fc__tag">{{ t }}</span>
          }
        </div>
      }
    </button>
  `,
  styles: `
    /* CSS copied verbatim from .fc* + .photo-slot* rules in source/sweet-thing-v2.html */
    .fc {
      display: block;
      width: 100%;
      padding: 0;
      background: transparent;
      border: none;
      color: var(--text);
      text-align: left;
      transition: opacity .2s;
      cursor: pointer;
    }

    .fc--dis {
      opacity: .45;
      cursor: default;
    }

    .fc__thumb {
      position: relative;
      aspect-ratio: 1/1;
      margin-bottom: 14px;
      background: var(--card-bg, #EFE8DD);
      overflow: hidden;
    }

    .fc__photo {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .fc__num {
      position: absolute;
      top: 12px;
      left: 12px;
      font-family: var(--f-sans);
      font-size: 10px;
      font-weight: 600;
      letter-spacing: .18em;
      color: var(--forest);
      background: var(--bg2);
      padding: 5px 9px;
      text-transform: uppercase;
    }

    .fc__sel-ring {
      position: absolute;
      inset: 0;
      border: 2px solid var(--forest);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fc__check {
      width: 48px;
      height: 48px;
      border-radius: 999px;
      background: var(--forest);
      color: var(--cream);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fc__title {
      font-family: var(--f-disp);
      font-size: 26px;
      line-height: 1.1;
      margin-bottom: 6px;
    }

    .fc__detail {
      font-size: 13px;
      color: var(--muted);
      line-height: 1.55;
    }

    .fc__tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 12px;
    }

    .fc__tag {
      font-size: 11px;
      font-weight: 500;
      color: var(--forest);
      padding: 3px 9px;
      background: var(--bg2);
      letter-spacing: .04em;
    }

    .photo-slot {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .photo-slot__lbl {
      font-size: 11px;
      letter-spacing: .15em;
      text-transform: uppercase;
      text-align: center;
      padding: 0 12px;
      line-height: 1.6;
      color: #6B5E48;
    }
  `,
})
export class FlavorCardComponent {
  readonly i18n = inject(I18nService);

  readonly flavor = input.required<Flavor>();
  readonly index = input.required<number>();
  readonly selected = input(false);
  readonly disabled = input(false);

  readonly cardClick = output<void>();

  readonly palette = computed(() => PALETTE[this.index() % PALETTE.length]);
  readonly numberLabel = computed(() => '0' + (this.index() + 1));
}
