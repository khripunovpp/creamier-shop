import {Component, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {firstValueFrom} from 'rxjs';
import {environment} from '../../env/environment';

@Component({
  selector: 'cm-dashboard',
  template: `
    <h1>Dashboard</h1>
  `,
  styles: `
    :host {
      display: block;
    }
  `
})
export class DashboardComponent {
  constructor() {
  }
  private readonly _httpClient = inject(HttpClient);
  ngOnInit() {
    this.getProducts().then(products => {
      console.log({products})
    }).catch(error => {
      console.error({error})
    });
  }
  getProducts() {
    return firstValueFrom(this._httpClient.get(
      environment.worker_url + '/api/admin/products',
      {withCredentials: true}
    ));
  }
}
