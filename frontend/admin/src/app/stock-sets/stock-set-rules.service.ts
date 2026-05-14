import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../env/environment';
import {StockSetRule} from './stock-sets.service';

export interface CreateStockSetRuleDto {
  count: number;
  price: number;
  max_flavors: number;
  position?: number;
}

@Injectable({providedIn: 'root'})
export class StockSetRulesService {
  private readonly _http = inject(HttpClient);
  private readonly _base = environment.worker_url + '/api/admin/stock-set-rules';

  list(setId?: string) {
    return this._http.get<StockSetRule[]>(this._base, {
      withCredentials: true,
      params: setId ? {set_id: setId} : {},
    });
  }

  create(setId: string, dto: CreateStockSetRuleDto) {
    return this._http.post<{ id: string }>(`${this._base}/${setId}`, dto, {withCredentials: true});
  }

  remove(id: string) {
    return this._http.delete<{ message: string }>(`${this._base}/${id}`, {withCredentials: true});
  }
}
