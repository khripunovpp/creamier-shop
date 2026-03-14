import {HttpErrorResponse} from '@angular/common/http';

export const errorToString = (error: unknown): string => {
  // стандартная JS ошибка
  if (error instanceof Error) {
    return error.message;
  }

  // HTTP ошибка Angular
  if (error instanceof HttpErrorResponse) {
    const err = error.error;
    if (err?.error?.details?.errors && Array.isArray(err.error.details.errors)) {
      return err.error.details.errors
        .map((e: any) => {
          const path = e.path?.join('.') || 'unknown';
          const message = e.message || 'Unknown validation error';
          const value = e.value !== undefined ? ` (value: ${e.value})` : '';
          return `${path}: ${message}${value}`;
        })
        .join('; ');
    } else if (err?.error) {
      return typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
    }
    return err?.error?.message || error.message;
  }

  // если строка
  if (typeof error === 'string') {
    return error;
  }

  // если объект
  if (typeof error === 'object' && error !== null) {
    if ('error' in error && 'details' in (error as any).error) {
      const details = (error as any).error.details;
      if (details.errors && Array.isArray(details.errors)) {
        return details.errors
          .map((e: any) => {
            const path = e.path?.join('.') || 'unknown';
            const message = e.message || 'Unknown validation error';
            const value = e.value !== undefined ? ` (value: ${e.value})` : '';
            return `${path}: ${message}${value}`;
          })
          .join('; ');
      }
      return (error as any).error.message || JSON.stringify(error);
    }
    return JSON.stringify(error);
  }

  return 'Unknown error';
};
