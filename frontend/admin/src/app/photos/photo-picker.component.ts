import {
  ChangeDetectionStrategy, Component, inject, input, output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../env/environment';
import { PhotosManifestService } from './photos-manifest.service';

@Component({
  selector: 'cm-photo-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let entries = photos();
    @if (entries === undefined) {
      <div class="photo-picker__status">Loading…</div>
    } @else if (entries.length === 0) {
      <div class="photo-picker__status">
        No photos in <code>frontend/shop/public/photos/</code>.
        Add files and rerun the admin build.
      </div>
    } @else {
      <div class="photo-picker">
        <button class="photo-picker__cell photo-picker__cell--none"
                type="button"
                [class.photo-picker__cell--on]="!value()"
                (click)="valueChange.emit(null)"
                aria-label="No photo">∅</button>
        @for (p of entries; track p.filename) {
          <button class="photo-picker__cell"
                  type="button"
                  [class.photo-picker__cell--on]="value() === p.url"
                  (click)="valueChange.emit(p.url)"
                  [attr.aria-label]="p.filename">
            <img [src]="shopBase + p.url" [alt]="p.filename" loading="lazy" decoding="async" />
          </button>
        }
      </div>
    }
  `,
  styles: `
    .photo-picker { display: grid; gap: 8px;
                    grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); }
    .photo-picker__status { padding: 12px; color: var(--text-color, #444); font-size: 13px; }
    .photo-picker__cell { position: relative; aspect-ratio: 1/1; padding: 0;
                          border: 2px solid transparent; background: #efe8dd;
                          overflow: hidden; cursor: pointer; transition: border-color .15s; }
    .photo-picker__cell:hover { border-color: rgba(0,0,0,.2); }
    .photo-picker__cell--on { border-color: var(--p-1, #2D4A3A); }
    .photo-picker__cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .photo-picker__cell--none { display: flex; align-items: center; justify-content: center;
                                font-family: 'Italiana', serif; font-size: 28px;
                                color: #888; background: #f4f4f4; }
  `,
})
export class PhotoPickerComponent {
  private readonly _manifest = inject(PhotosManifestService);

  readonly value = input<string | null>(null);
  readonly valueChange = output<string | null>();

  readonly shopBase = environment.shop_url;
  // initialValue prevents toSignal from throwing if the HTTP fetch errors out
  // (PhotosManifestService also catches it, but belt-and-suspenders).
  readonly photos = toSignal(this._manifest.photos$, { initialValue: [] });
}
