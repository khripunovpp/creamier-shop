import {ApplicationConfig, provideZonelessChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {MAT_DATE_LOCALE} from '@angular/material/core';
import {routes} from './app.routes';
import {provideHotToastConfig} from '@ngxpert/hot-toast';
import {provideDateFnsAdapter} from '@angular/material-date-fns-adapter';
import {ru} from 'date-fns/locale';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHotToastConfig(),

    provideDateFnsAdapter(),
    {
      provide: MAT_DATE_LOCALE,
      useValue: ru,
    }
  ]
};
