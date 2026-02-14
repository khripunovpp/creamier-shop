import {isPlatformBrowser} from '@angular/common';
import {inject, InjectionToken, PLATFORM_ID} from '@angular/core';

export const IS_CLIENT = new InjectionToken("indicates if the code is running on the client side", {
  providedIn: "root",
  factory: () => isPlatformBrowser(inject(PLATFORM_ID))
});
