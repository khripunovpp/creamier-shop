import {inject} from '@angular/core';
import {StockService} from '../../stock/stock.service';
import {firstValueFrom} from 'rxjs';

export interface SelectResourcesConfig {
  name: string
  loaderConfig?: LocalstorageSelectLoaderConfig
    | CustomSelectLoaderConfig
}

export interface LocalstorageSelectLoaderConfig {
  name: string
  key: string
}

export interface CustomSelectLoaderConfig {
  asyncFactory?: () => Promise<any>
}

export const resources: Record<string, SelectResourcesConfig> = {
  products: {
    name: 'products',
    loaderConfig: {
      asyncFactory: () => {
        const loader = inject(StockService);
        return firstValueFrom(loader.getProducts({withArchived: true}));
      }
    }
  },
}
