import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, shareReplay } from 'rxjs';

export interface PhotoManifestEntry {
  filename: string;
  url: string;
}

interface PhotoManifest {
  generatedAt: string;
  photos: PhotoManifestEntry[];
}

@Injectable({ providedIn: 'root' })
export class PhotosManifestService {
  private readonly _http = inject(HttpClient);

  // Manifest is generated at build time by scripts/build-photos-manifest.js,
  // served same-origin from admin's /public. If the file is missing or invalid,
  // fall back to an empty list rather than propagating the HTTP error — the
  // picker component shows a friendly "no photos" message.
  readonly photos$: Observable<PhotoManifestEntry[]> = this._http
    .get<PhotoManifest>('/photos-manifest.json')
    .pipe(
      map(m => m?.photos ?? []),
      catchError((err) => {
        console.warn('[photos-manifest] failed to load /photos-manifest.json', err);
        return of([] as PhotoManifestEntry[]);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
}
