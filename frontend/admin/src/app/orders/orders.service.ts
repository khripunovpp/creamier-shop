import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../env/environment';

export interface Order {

  user_id: number
  created_at: string
  completed_at: string | null
  delivery_date: string | null
  status: 'pending' | 'completed' | 'cancelled'
  total_amount: number
  discount_amount: number
  profit_amount: number
  payment_data: Record<string, any>
  comment: string | null
  delivery_info: {
    postalCode: string
    addressLine1: string
    addressLine2: string | null
  }
  paid_at: string | null
  payment_method: 'cash' | 'card' | 'bank_transfer'
}

@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  constructor() {
  }

  private readonly _httpClient = inject(HttpClient);

  getOrders() {
    return this._httpClient.get<Order[]>(
      environment.worker_url + '/api/admin/orders',
      {withCredentials: true},
    );
  }

  getOneOrder(
    id: string,
  ) {
    return this._httpClient.get<Order>(
      environment.worker_url + `/api/admin/orders/${id}`,
      {withCredentials: true,},
    );
  }
}
