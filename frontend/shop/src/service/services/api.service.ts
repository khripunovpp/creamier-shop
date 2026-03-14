import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor() {
  }

  private readonly _http = inject(HttpClient);

  get<T>(url: string) {
    return this._http.get<T>(url);
  }

  post<T>(url: string, body: any) {
    return this._http.post<T>(url, body, {withCredentials: true});
  }
}
