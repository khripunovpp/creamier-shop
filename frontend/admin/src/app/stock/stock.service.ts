import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../env/environment';

export interface StockItem {
  id: string
  name: string
  description: string
  quantity: number
  price: number
  cost_price: number
  is_service: boolean
  status: 'active' | 'stopped' | 'archived'
  created_at: string
  stopped_at: string | null
  category_id: string | null
  category?: { id: string; name: string } | null
  badge: 'sale' | 'hot' | null
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  constructor() {
  }

  private readonly _httpClient = inject(HttpClient);

  getProducts(params?: { withArchived: boolean }) {
    return this._httpClient.get<StockItem[]>(
      environment.worker_url + '/api/admin/products',
      {
        withCredentials: true,
        params: {
          withArchived: params?.withArchived ? 'true' : 'false',
        }
      },
    );
  }

  getOneProduct(id: string) {
    return this._httpClient.get<StockItem>(
      environment.worker_url + `/api/admin/products/${id}`,
      {
        withCredentials: true,
      },
    );
  }

  createProduct(
    data: Omit<StockItem, 'id' | 'created_at' | 'stopped_at' | 'status' | 'quantity'>,
  ) {
    return this._httpClient.post<StockItem>(
      environment.worker_url + '/api/admin/products',
      {
        name: data.name,
        description: data.description,
        price: data.price,
        cost_price: data.cost_price,
        is_service: data.is_service ?? false,
        category_id: data.category_id ?? null,
        badge: data.badge ?? null,
      },
      {withCredentials: true}
    );
  }

  createService(
    data: Omit<StockItem, 'id' | 'created_at' | 'stopped_at' | 'status' | 'is_service'>,
  ) {
    return this._httpClient.post<StockItem>(
      environment.worker_url + '/api/admin/products',
      {
        name: data.name,
        description: data.description,
        price: data.price,
        cost_price: data.cost_price,
        is_service: true,
      },
      {withCredentials: true}
    );
  }

  updateProduct(
    id: string,
    data: Omit<StockItem, 'id' | 'created_at' | 'stopped_at' | 'status' | 'is_service' | 'quantity'>,
  ) {
    return this._httpClient.put<StockItem>(
      environment.worker_url + `/api/admin/products/${id}`,
      {
        name: data.name,
        description: data.description,
        price: data.price,
        cost_price: data.cost_price,
        category_id: data.category_id ?? null,
        badge: data.badge ?? null,
      },
      {withCredentials: true}
    );
  }

  archiveProduct(id: string) {
    return firstValueFrom(
      this._httpClient.post(
        environment.worker_url + `/api/admin/products/${id}/archive`,
        {},
        {withCredentials: true},
      )
    );
  }

  activateProduct(id: string) {
    return firstValueFrom(
      this._httpClient.post(
        environment.worker_url + `/api/admin/products/${id}/activate`,
        {},
        {withCredentials: true},
      )
    );
  }

  deactivateProduct(id: string) {
    return firstValueFrom(
      this._httpClient.post(
        environment.worker_url + `/api/admin/products/${id}/deactivate`,
        {},
        {withCredentials: true},
      )
    );
  }

  moveStockItem(
    data: {
      quantity: number
      operation: 'add' | 'remove',
      uuid: string
    }
  ) {
    return this._httpClient.post(
      environment.worker_url + `/api/admin/products/${data.uuid}/move`,
      {
        quantity: +data.quantity,
        operation: data.operation,
      },
      {withCredentials: true}
    );
  }
}
