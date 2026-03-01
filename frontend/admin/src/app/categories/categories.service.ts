import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../env/environment';

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  constructor() {}

  private readonly _httpClient = inject(HttpClient);

  getCategories() {
    return this._httpClient.get<Category[]>(
      environment.worker_url + '/api/admin/categories',
      {withCredentials: true},
    );
  }

  getOneCategory(id: string) {
    return this._httpClient.get<Category>(
      environment.worker_url + `/api/admin/categories/${id}`,
      {withCredentials: true},
    );
  }

  createCategory(data: Pick<Category, 'name'>) {
    return this._httpClient.post<Category>(
      environment.worker_url + '/api/admin/categories',
      {name: data.name},
      {withCredentials: true},
    );
  }

  updateCategory(id: string, data: Pick<Category, 'name'>) {
    return this._httpClient.put<Category>(
      environment.worker_url + `/api/admin/categories/${id}`,
      {name: data.name},
      {withCredentials: true},
    );
  }
}

