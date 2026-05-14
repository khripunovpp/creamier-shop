import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, shareReplay, tap } from 'rxjs';
import { ApiService } from './api.service';
import { environment } from '../../env/environment';
import { StockSet } from '../../types/set.type';
import { Rule } from '../../types/rule.type';

@Injectable({ providedIn: 'root' })
export class SetsService {
  private readonly _apiService = inject(ApiService);

  private readonly _sets$ = new BehaviorSubject<StockSet[] | null>(null);

  readonly sets$: Observable<StockSet[]> = this._apiService
    .get<StockSet[]>(environment.worker_url + '/api/sets')
    .pipe(
      tap(sets => this._sets$.next(sets)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

  snapshot(): StockSet[] | null {
    return this._sets$.value;
  }

  findRuleById(ruleId: string): { set: StockSet; rule: Rule } | null {
    for (const set of this.snapshot() ?? []) {
      const rule = set.rules.find(r => r.id === ruleId);
      if (rule) return { set, rule };
    }
    return null;
  }
}
