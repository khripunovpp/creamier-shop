import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../env/environment';

export interface OrderItemFlavor {
  position: number;
  stock_item: { id: string; name: string; name_pt: string };
}

export interface OrderItem {
  id: string;
  stock_item_id: string | null;
  // set_slug + set_count are snapshots written at order creation; order_items
  // no longer carries a FK to stock_set_rules so admin can edit rules freely.
  set_slug: string | null;
  set_count: number | null;
  quantity: number;
  price: number;
  cost_price: number;
  flavors?: OrderItemFlavor[];
}

export interface OrderCustomer {
  name: string;
  email: string | null;
  phone_number: string | null;
  telegram: string | null;
  whatsapp: string | null;
}

export interface Order {
  id: string;
  user_id: string | null;
  created_at: string;
  completed_at: string | null;
  delivery_date: string | null;
  status: 'created' | 'paid' | 'delivered' | 'cancelled' | 'returned';
  total_amount: number;
  discount_amount: number;
  profit_amount: number;
  payment_data: Record<string, unknown> | null;
  comment: string | null;
  // delivery_info is JSONB; new orders carry `time`, `contact_channel`, and optional `address`.
  delivery_info: Record<string, unknown> | null;
  paid_at: string | null;
  payment_method: 'cash' | 'bank_transfer' | null;
  delivery_type: 'pickup' | 'delivery';
  items?: OrderItem[];
  customer?: OrderCustomer;
}

export interface AdminCreateOrderDto {
  items: { stock_set_rule_id: string; flavor_ids: string[]; quantity: number }[];
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
  status?: Order['status'];
  discount_amount?: number;
  payment_method?: NonNullable<Order['payment_method']> | null;
  paid_at?: string | null;
}

export interface AdminUpdateOrderDto {
  delivery_date?: string | null;
  delivery_time?: string | null;
  delivery_info?: Record<string, unknown> | null;
  delivery_type?: 'pickup' | 'delivery';
  comment?: string | null;
  discount_amount?: number;
  status?: 'cancelled' | 'returned';
  customer?: {
    name?: string;
    email?: string | null;
    phone_number?: string | null;
    telegram?: string | null;
    whatsapp?: string | null;
  };
}

export interface AdminAddItemDto {
  stock_set_rule_id: string;
  flavor_ids: string[];
  quantity: number;
}

export interface AdminUpdateItemDto {
  quantity: number;
}

@Injectable({providedIn: 'root'})
export class OrdersService {
  private readonly _http = inject(HttpClient);
  private readonly _base = environment.worker_url + '/api/admin/orders';

  getOrders() {
    return this._http.get<Order[]>(this._base, {withCredentials: true});
  }

  getOneOrder(id: string) {
    return this._http.get<Order>(`${this._base}/${id}`, {withCredentials: true});
  }

  createOrder(dto: AdminCreateOrderDto) {
    return this._http.post<{ id: string }>(this._base, dto, {withCredentials: true});
  }

  updateOrder(id: string, dto: AdminUpdateOrderDto) {
    return this._http.put<{ message: string }>(`${this._base}/${id}`, dto, {withCredentials: true});
  }

  addItem(orderId: string, dto: AdminAddItemDto) {
    return this._http.post<{ id: string }>(
      `${this._base}/${orderId}/items`, dto, {withCredentials: true},
    );
  }

  updateItem(orderId: string, itemId: string, dto: AdminUpdateItemDto) {
    return this._http.put<{ message: string }>(
      `${this._base}/${orderId}/items/${itemId}`, dto, {withCredentials: true},
    );
  }

  deleteItem(orderId: string, itemId: string) {
    return this._http.delete<{ message: string }>(
      `${this._base}/${orderId}/items/${itemId}`, {withCredentials: true},
    );
  }

  markOrderPaid(
    id: string,
    payload: { payment_method: NonNullable<Order['payment_method']>; payment_data: any },
  ) {
    return this._http.post(`${this._base}/${id}/mark_paid`, payload, {withCredentials: true});
  }

  markOrderDelivered(id: string) {
    return this._http.post(`${this._base}/${id}/mark_delivered`, null, {withCredentials: true});
  }
}
