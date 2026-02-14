import {inject, Injectable} from '@angular/core';
import {ApiService} from './api.service';
import {environment} from '../../env/environment';
import {Product} from '../../types/product.type';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  constructor() {
  }

  private readonly _apiService = inject(ApiService);

  getProducts() {
    return this._apiService.get<Product[]>(
      environment.worker_url + '/api/public/products',
    );
  }
}
