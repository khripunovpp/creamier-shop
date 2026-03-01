import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../env/environment';

export interface Order {
  id: string
  user_id: number
  created_at: string
  completed_at: string | null
  delivery_date: string | null
  status: 'created' | 'paid' | 'delivered' | 'cancelled' | 'returned'
  total_amount: number
  discount_amount: number
  profit_amount: number
  payment_data: string
  comment: string | null
  delivery_info: {
    postalCode: string
    addressLine1: string
    addressLine2: string | null
  }
  paid_at: string | null
  payment_method: 'cash' | 'bank_transfer'
  items: {
    stock_item_id: string
    quantity: number
    price: number
    cost_price: number
    is_service: boolean
  }[]
  customer: {
    name: string
    email: string
    phone_number: string | null
    telegram: string | null
    whatsapp: string | null
  }
}

type CreateOrderDto = Omit<
  Order,
  'id'
  | 'created_at'
  | 'completed_at'
  | 'paid_at'
  | 'status'
  | 'profit_amount'
  | 'user_id'
  | 'total_amount'
  | 'items'
  | 'customer'
> & {
  items: {
    stock_item_id: string
    quantity: number
  }[]
};

type UpdateOrderDto = Omit<
  Order,
  'id'
  | 'created_at'
  | 'completed_at'
  | 'paid_at'
  | 'status'
  | 'profit_amount'
  | 'user_id'
  | 'total_amount'
  | 'items'
  | 'customer'
> & {
  items: {
    stock_item_id: string
    quantity: number
  }[]
};

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

  markOrderPaid(
    id: string,
    payload: {
      payment_method: Order['payment_method'],
      payment_data: Order['payment_data'],
    }
  ) {
    return this._httpClient.post(
      environment.worker_url + `/api/admin/orders/${id}/mark_paid`,
      {
        payment_method: payload.payment_method,
        payment_data: payload.payment_data,
      },
      {withCredentials: true,},
    );
  }

  markOrderDelivered(
    id: string,
  ) {
    return this._httpClient.post(
      environment.worker_url + `/api/admin/orders/${id}/mark_delivered`,
      null,
      {withCredentials: true,},
    );
  }

  createOrder(
    order: CreateOrderDto,
  ) {
    return this._httpClient.post<Order>(
      environment.worker_url + `/api/admin/orders`,
      order,
      {withCredentials: true,},
    );
  }

  updateOrder(
    id: string,
    order: UpdateOrderDto,
  ) {
    return this._httpClient.put<Order>(
      environment.worker_url + `/api/admin/orders/${id}`,
      order,
      {withCredentials: true,},
    );
  }
}
