import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../env/environment';

export interface StockSetItemEntry {
  position: number;
  stock_item: {
    id: string;
    name: string;
    name_pt: string;
    status: 'active' | 'stopped' | 'archived';
    photo_id: string | null;
  };
}

@Injectable({providedIn: 'root'})
export class StockSetItemsService {
  private readonly _http = inject(HttpClient);
  private readonly _base = environment.worker_url + '/api/admin/stock-set-items';

  list(setId: string) {
    return this._http.get<StockSetItemEntry[]>(`${this._base}/${setId}`, {withCredentials: true});
  }

  link(setId: string, stock_item_id: string, position = 0) {
    return this._http.post<{ message: string }>(
      `${this._base}/${setId}`,
      {stock_item_id, position},
      {withCredentials: true},
    );
  }

  reorder(setId: string, stock_item_id: string, position: number) {
    return this._http.put<{ message: string }>(
      `${this._base}/${setId}/${stock_item_id}`,
      {position},
      {withCredentials: true},
    );
  }

  unlink(setId: string, stock_item_id: string) {
    return this._http.delete<{ message: string }>(
      `${this._base}/${setId}/${stock_item_id}`,
      {withCredentials: true},
    );
  }
}
