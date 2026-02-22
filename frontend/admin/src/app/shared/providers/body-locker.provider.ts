import {inject, InjectionToken, PLATFORM_ID} from '@angular/core';
import {isPlatformBrowser} from '@angular/common';

export const BODY_LOCKER = new InjectionToken('BODY_LOCKER', {
  factory: () => {
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    if (!isBrowser) {
      return {
        lock: () => {
        },
        unlock: () => {
        }
      };
    }

    return {
      lock: () => {
        document.body.style.overflow = 'hidden';
      },
      unlock: () => {
        document.body.style.overflow = '';
      }
    };
  }
})
