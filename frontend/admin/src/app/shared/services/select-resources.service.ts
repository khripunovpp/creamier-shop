import {inject, Injectable, Injector, Optional, runInInjectionContext} from '@angular/core';

import {LocalstorageSelectLoaderConfig, resources, SelectResourcesConfig} from '../const/select-resources.configs';
import {BehaviorSubject, Observable} from 'rxjs';
import {LocalstorageSelectLoaderService} from './localstorage-select-loader.service';

export interface SelectResourceLoader<T = unknown> {
  load(name: string): Promise<T[]>
}

export interface SelectResource<T = unknown> {
  name: string
  list: T[]
  lists?: Record<string, T[]>
  loader: SelectResourceLoader<T>
  stream?: Observable<T[]>
  cfg: SelectResourcesConfig
  updatedAt?: number
}

function isCustomLoader(cfg: SelectResourcesConfig) {
  return !!cfg.loaderConfig && (cfg.loaderConfig as any).asyncFactory;
}

@Injectable({
  providedIn: 'root'
})
export class SelectResourcesService {
  constructor(
    @Optional() private _localstorageSelectLoaderService: LocalstorageSelectLoaderService,
  ) {
  }

  private readonly _injector = inject(Injector);
  _registry = new Map<string, SelectResource>();
  private _registry$ = new BehaviorSubject<Map<string, SelectResource>>(new Map());

  get registryStream() {
    return this._registry$;
  }

  register<T>(name: string) {
    if (this._registry.has(name)) return;
    const cfg = resources[name];
    if (!cfg) {
      throw new Error(`SelectResource ${name} not found`);
      return;
    }
    const stream = new BehaviorSubject([] as T[]);
    this._registry.set(cfg.name, {
      cfg,
      name: cfg.name,
      list: [],
      lists: {},
      loader: {
        load: async () => {
          if (isCustomLoader(cfg)) {
            return (cfg.loaderConfig as LocalstorageSelectLoaderConfig | any)?.asyncFactory();
          }
          return null;
        },
      },
      stream: stream.asObservable(),
    });
  }

  get<T>(name: string): T {
    return this._registry.get(name) as T;
  }

  load<T>(
    resources?: string[],
    force = false
  ) {
    const keys = resources || Array.from(this._registry.keys());
    console.log({registry: this._registry, keys})

    return Promise.all(keys.map(async key => {
      const cfg = this.get<SelectResource<T>>(key);
      const cacheLifetime = 1000 * 60 * 5; // 5 minutes
      if (cfg.updatedAt && Date.now() - cfg.updatedAt < cacheLifetime && !force) {
        return;
      }
      console.log({
        dateNow: new Date(),
        updatedAt: cfg.updatedAt ? new Date(cfg.updatedAt) : null,
        diff: Date.now() - (cfg.updatedAt || 0),
        cacheLifetime,
        cfgUpdatedAt: cfg.updatedAt,
        cfg
      });
      let result: any;
      await runInInjectionContext(this._injector, async () => {
        result = await cfg.loader.load(cfg.name)
      });

      if (Array.isArray(result)) {
        cfg.list = result;
      } else {
        cfg.lists = result as Record<string, T[]>;
      }

      cfg.updatedAt = Date.now();
    })).then(() => {
      return keys.reduce((acc, key) => {
        acc[key] = this.get(key);
        return acc;
      }, {} as Record<string, T[]>);
    }).then(() => {
      this._registry$.next(this._registry);
    });
  }

  subscribe(fn: (registry: Map<string, SelectResource>) => void) {
    return this._registry$.subscribe(fn);
  }
}
