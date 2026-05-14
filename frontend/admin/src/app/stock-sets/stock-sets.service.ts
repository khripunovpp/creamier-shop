import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../env/environment';

export interface StockSetRule {
  id: string;
  count: number;
  price: number;
  max_flavors: number;
  position: number;
}

export interface StockSetItemLink {
  stock_item_id: string;
  position: number;
  stock_item?: { id: string; name: string; name_pt: string; status: string };
}

export interface StockSet {
  id: string;
  slug: string;
  name_ru: string;
  name_pt: string;
  description_ru: string | null;
  description_pt: string | null;
  status: 'active' | 'stopped' | 'archived';
  position: number;
  created_at: string;
  rules?: StockSetRule[];
  items?: StockSetItemLink[];
}

export type CreateStockSetDto = Omit<StockSet, 'id' | 'created_at' | 'rules' | 'items'>;
export type UpdateStockSetDto = Partial<CreateStockSetDto>;

@Injectable({ providedIn: 'root' })
export class StockSetsService {
  private readonly _http = inject(HttpClient);
  private readonly _base = environment.worker_url + '/api/admin/stock-sets';

  getAll(params?: { withArchived?: boolean }) {
    return this._http.get<StockSet[]>(this._base, {
      withCredentials: true,
      params: { withArchived: params?.withArchived ? 'true' : 'false' },
    });
  }
  getOne(id: string)             { return this._http.get<StockSet>(`${this._base}/${id}`, { withCredentials: true }); }
  create(dto: CreateStockSetDto) { return this._http.post<{ id: string }>(this._base, dto, { withCredentials: true }); }
  update(id: string, dto: UpdateStockSetDto) {
    return this._http.put<{ message: string }>(`${this._base}/${id}`, dto, { withCredentials: true });
  }
  archive(id: string)    { return this._http.post(`${this._base}/${id}/archive`,    {}, { withCredentials: true }); }
  activate(id: string)   { return this._http.post(`${this._base}/${id}/activate`,   {}, { withCredentials: true }); }
  deactivate(id: string) { return this._http.post(`${this._base}/${id}/deactivate`, {}, { withCredentials: true }); }
}
