import {Injectable} from '@angular/core';
import {HotToastService, ToastOptions} from '@ngxpert/hot-toast';
import {FormArray, FormGroup} from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  constructor(
    private _toast: HotToastService,
  ) {
  }

  private _options: ToastOptions<any> = {
    duration: 5000,
    position: 'bottom-right' as const,
    dismissible: true,
  };

  success(message: string, logToCenter: boolean = false, source?: string) {
    this._toast.success(message, this._options);
    this._tryHapticFeedback('success');
  }

  error(message: string, logToCenter: boolean = true, source?: string) {
    this._toast.error(message, this._options);
    this._tryHapticFeedback('error');
  }

  warning(message: string, logToCenter: boolean = true, source?: string) {
    this._toast.warning(message, this._options);
    this._tryHapticFeedback('warning');
  }

  info(message: string, logToCenter: boolean = false, source?: string) {
    this._toast.info(message, this._options);
    this._tryHapticFeedback('success');
  }

  show(message: string, logToCenter: boolean = false, source?: string) {
    this._toast.show(message, this._options);
    this._tryHapticFeedback('success');
  }

  loading(message: string) {
    return this._toast.loading(message, this._options);
  }

  showJsonErrors(
    errors: unknown[],
    title: string = 'Errors',
    logToCenter: boolean = true,
    source?: string
  ) {
    const errorMessages = errors.map((error) => {
      if (typeof error === 'string') {
        return error;
      } else if (typeof error === 'object' && error !== null) {
        return JSON.stringify(error, null, 2);
      }
      return String(error);
    });

    const fullMessage = errorMessages.join('\n');
    this._toast.error(fullMessage, {
      duration: 10000,
      style: {
        whiteSpace: 'pre-wrap',
        maxHeight: '300px',
        overflowY: 'auto',
      },
    });
  }

  parseFormErrors(
    control: FormGroup | FormArray,
    options: {
      logToCenter?: boolean,
      source?: string
      controlsMap?: Record<string, string>
      keysMap?: Record<string, string>
    } = {
      logToCenter: true
    }
  ): string[] {
    const errors = [];
    if (control.errors) {
      errors.push(...Object.entries(control.errors).map(([key, value]) => {
        const mappedKey = options?.keysMap?.[key] ?? key;
        return `${mappedKey}: ${value}`;
      }));
    }
    for (const controlKey in control.controls) {
      const childControl = (control.controls as any)[controlKey];
      if (childControl instanceof FormGroup || childControl instanceof FormArray) {
        errors.push(...this.parseFormErrors(childControl as any, options));
      }
      if (childControl.errors) {
        errors.push(...Object.entries(childControl.errors)
          .map(([key, value]) => {
            const mappedControlKey = options?.controlsMap?.[controlKey] ?? controlKey;
            const mappedKey = options?.keysMap?.[key] ?? key;

            return `${mappedControlKey}: ${mappedKey}`;
          }));
      }
    }

    return errors;
  }

  private _tryHapticFeedback(
    type: 'success' | 'error' | 'warning' = 'success'
  ) {
    try {
      (window as any)?.TelegramWebApp?.HapticFeedback?.notificationOccurred(type);
    } catch {
      // Ignore errors
    }
  }
}
