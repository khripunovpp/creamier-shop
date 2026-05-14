import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../env/environment';

// Mirrors the Zod schema in backend/api-public/src/schemes/create-order.scheme.ts.
// Server validates the shape; this type just keeps the call site accurate.
export interface CreateOrderPayload {
  items: { stock_set_rule_id: string; flavor_ids: string[]; quantity: number }[];
  contact_channel: 'whatsapp' | 'telegram' | 'phone' | 'email';
  name: string;
  email?: string | null;
  phone_number?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  delivery_date?: string | null;
  delivery_time?: string | null;
  delivery_info?: Record<string, unknown> | null;
  delivery_type?: 'pickup' | 'delivery';
  comment?: string | null;
}

export interface CreateOrderResponse {
  orderId: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly _api = inject(ApiService);

  create(payload: CreateOrderPayload): Observable<CreateOrderResponse> {
    return this._api.post<CreateOrderResponse>(
      environment.worker_url + '/api/orders/create',
      payload,
    );
  }
}
