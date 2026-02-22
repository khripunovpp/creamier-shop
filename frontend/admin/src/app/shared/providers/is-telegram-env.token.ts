import {InjectionToken} from '@angular/core';

export const IS_TELEGRAM = new InjectionToken<boolean>('Indicates Telegram Mini App environment', {
  factory: () => {
    try {
      return (window as any).Telegram.WebApp.initData
    } catch (e) {
      return false;
    }
  }
});
