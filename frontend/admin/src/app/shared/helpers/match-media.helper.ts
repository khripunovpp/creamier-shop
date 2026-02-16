import {computed, inject, InjectionToken, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';

export const IS_MOBILE_MEDIA_MATCHED = new InjectionToken('mediaMobMax', {
  factory: () => {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    return (
      breakpoint: string | number = 768,
    ) => {
      if (isBrowser) {
        return window.matchMedia(`(max-width: ${breakpoint}px)`).matches;
      } else {
        return false;
      }
    };
  }
});

export const IS_PWA = new InjectionToken('isPWA', {
  factory: () => {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    if (!isBrowser) {
      return computed(() => false);
    }
    return computed(() => {
      return window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any)['standalone'] === true;
    });
  }
});
