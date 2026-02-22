import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../env/environment';

export interface StockItem {
  id: number
  name: string
  description: string
  quantity: number
  price: number
  cost_price: number
  is_service: boolean
  status: 'active' | 'stopped'
  created_at: string
  stopped_at: string | null
}

@Injectable({
  providedIn: 'root'
})
export class StockService {
  constructor() {
  }

  private readonly _httpClient = inject(HttpClient);

  getProducts() {
    return this._httpClient.get<StockItem[]>(
      environment.worker_url + '/api/admin/products',
      {withCredentials: true},
    );
  }

  createProduct(
    data: Omit<StockItem, 'id' | 'created_at' | 'stopped_at' | 'status' | 'is_service'>,
  ) {
    return this._httpClient.post<StockItem>(
      environment.worker_url + '/api/admin/products',
      {
        ...data,
        is_service: false,
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
        ...data,
        is_service: true,
      },
      {withCredentials: true}
    );
  }

  archiveProduct(id: number) {
    return firstValueFrom(
      this._httpClient.post(
        environment.worker_url + `/api/admin/products/${id}/archive`,
        {withCredentials: true},
      )
    );
  }

  deactivateProduct(id: number) {
    return firstValueFrom(
      this._httpClient.post(
        environment.worker_url + `/api/admin/products/${id}/deactivate`,
        {},
        {withCredentials: true},
      )
    );
  }

  activateProduct(id: number) {
    return firstValueFrom(
      this._httpClient.post(
        environment.worker_url + `/api/admin/products/${id}/activate`,
        {},
        {withCredentials: true},
      )
    );
  }
}
