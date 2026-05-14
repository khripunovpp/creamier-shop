import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeroComponent } from '../view/sections/hero.component';
import { EditorialComponent } from '../view/sections/editorial.component';
import { GalleryComponent } from '../view/sections/gallery.component';
import { ReviewsComponent } from '../view/sections/reviews.component';
import { CateringComponent } from '../view/sections/catering.component';
import { FooterComponent } from '../view/sections/footer.component';
import { ProductSectionComponent } from '../view/products/product-section.component';
import { ProductSectionSkeletonComponent } from '../view/products/product-section-skeleton.component';
import { SetsService } from '../service/services/sets.service';

const EXPECTED_SET_SLUGS = ['tartlet', 'eclair'] as const;

const CHAPTERS_BY_SLUG: Record<string, { ru: string; pt: string }> = {
  tartlet: { ru: 'Глава первая', pt: 'Capítulo um' },
  eclair:  { ru: 'Глава вторая', pt: 'Capítulo dois' },
};

@Component({
  selector: 'cmh-home',
  imports: [
    HeroComponent,
    ProductSectionComponent,
    ProductSectionSkeletonComponent,
    EditorialComponent,
    GalleryComponent,
    ReviewsComponent,
    CateringComponent,
    FooterComponent,
  ],
  template: `
    <cmh-hero/>

    @let list = sets();
    @if (list === undefined) {
      <cmh-product-section-skeleton/>
      <cmh-editorial/>
      <cmh-product-section-skeleton/>
    } @else {
      @for (s of list; track s.id; let i = $index) {
        @defer (on immediate) {
          <cmh-product-section [chapter]="chapterFor(s.slug)" [set]="s"/>
        } @placeholder {
          <cmh-product-section-skeleton/>
        } @loading (minimum 300ms) {
          <cmh-product-section-skeleton/>
        }

        @if (i === 0) {
          <cmh-editorial/>
        }
      }
    }

    @defer {
      <cmh-gallery/>
      <cmh-reviews/>
      <cmh-catering/>
    }
    <cmh-footer/>
  `,
})
export class HomeComponent {
  private readonly _sets = inject(SetsService);

  // No initial value — sets() is `undefined` until the HTTP response lands,
  // which lets the template distinguish "loading" (show skeletons) from
  // "empty catalog" (loaded but nothing to show).
  readonly sets = toSignal(this._sets.sets$);
  protected readonly EXPECTED_SET_SLUGS = EXPECTED_SET_SLUGS;

  chapterFor(slug: string) {
    return CHAPTERS_BY_SLUG[slug] ?? { ru: '', pt: '' };
  }
}
