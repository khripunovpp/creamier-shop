import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../env/environment';

export interface StockItem {
  id: string;
  name: string;
  name_pt: string;
  detail_ru: string | null;
  detail_pt: string | null;
  tags_ru: string[] | null;
  tags_pt: string[] | null;
  photo_url: string | null;
  position: number;
  price: number;
  cost_price: number;
  status: 'active' | 'stopped' | 'archived';
  badge: 'sale' | 'hot' | null;
  quantity: number;
  created_at: string;
  stopped_at: string | null;
}

export type CreateStockItemDto = Omit<
  StockItem, 'id' | 'quantity' | 'created_at' | 'stopped_at'
>;
export type UpdateStockItemDto = Partial<CreateStockItemDto>;

@Injectable({providedIn: 'root'})
export class StockService {
  private readonly _http = inject(HttpClient);

  getProducts(params?: { withArchived: boolean }) {
    return this._http.get<StockItem[]>(
      environment.worker_url + '/api/admin/products',
      {
        withCredentials: true,
        params: {withArchived: params?.withArchived ? 'true' : 'false'},
      },
    );
  }

  getOneProduct(id: string) {
    return this._http.get<StockItem>(
      environment.worker_url + `/api/admin/products/${id}`,
      {withCredentials: true},
    );
  }

  createProduct(dto: CreateStockItemDto) {
    return this._http.post<{ id: string }>(
      environment.worker_url + '/api/admin/products',
      dto,
      {withCredentials: true},
    );
  }

  updateProduct(id: string, dto: UpdateStockItemDto) {
    return this._http.put<{ message: string }>(
      environment.worker_url + `/api/admin/products/${id}`,
      dto,
      {withCredentials: true},
    );
  }

  archiveProduct(id: string) {
    return firstValueFrom(this._http.post(
      environment.worker_url + `/api/admin/products/${id}/archive`, {},
      {withCredentials: true},
    ));
  }

  activateProduct(id: string) {
    return firstValueFrom(this._http.post(
      environment.worker_url + `/api/admin/products/${id}/activate`, {},
      {withCredentials: true},
    ));
  }

  deactivateProduct(id: string) {
    return firstValueFrom(this._http.post(
      environment.worker_url + `/api/admin/products/${id}/deactivate`, {},
      {withCredentials: true},
    ));
  }

  moveStockItem(data: { quantity: number; operation: 'add' | 'remove'; uuid: string }) {
    return this._http.post(
      environment.worker_url + `/api/admin/products/${data.uuid}/move`,
      {quantity: +data.quantity, operation: data.operation},
      {withCredentials: true},
    );
  }
}
