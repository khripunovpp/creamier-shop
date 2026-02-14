import {inject, InjectionToken} from '@angular/core';
import {isActive, Router} from '@angular/router';

export const IS_HOME = new InjectionToken("indicates if the current page is the home page", {
  providedIn: "root",
  factory: () => {
    const router = inject(Router);

    return isActive('/', router, {
      paths: 'exact',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored'
    })
  }
});
