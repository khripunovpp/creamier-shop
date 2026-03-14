import {HttpInterceptorFn} from '@angular/common/http';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (MUTATING_METHODS.has(req.method)) {
    const token = getCookie('csrf_token');
    if (token) {
      req = req.clone({
        setHeaders: {'X-CSRF-Token': token},
        withCredentials: true,
      });
    }
  }
  return next(req);
};
