import {ApplicationConfig, provideZonelessChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {MAT_DATE_LOCALE} from '@angular/material/core';
import {provideHotToastConfig} from '@ngxpert/hot-toast';
import {provideDateFnsAdapter} from '@angular/material-date-fns-adapter';
import {ru} from 'date-fns/locale';
import {routes} from './app.routes';
import {authInterceptor} from './shared/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([
      authInterceptor,
    ])),
    provideHotToastConfig(),
    provideDateFnsAdapter(),
    {
      provide: MAT_DATE_LOCALE,
      useValue: ru,
    }
  ]
};
