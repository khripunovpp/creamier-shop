import {InjectionToken} from '@angular/core';
import {environment} from '../../../env/environment';

export interface Environment {
  production: boolean;
  googleSheets?: {
    appsScriptUrl: string
  };
}

export const ENV = new InjectionToken<Environment>('ENV', {
  factory: () => {
    return environment;
  }
});
