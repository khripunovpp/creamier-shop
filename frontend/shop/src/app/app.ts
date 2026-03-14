import {Component, inject, OnInit} from '@angular/core';
import {HeaderComponent} from '../view/sections/header.component';
import {RouterOutlet} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {environment} from '../env/environment';
import {IS_CLIENT} from '../service/providers/is_client.provider';

@Component({
  selector: 'app-root',
  imports: [
    HeaderComponent,
    RouterOutlet,
  ],
  template: `
    <main class="page-wrapper">
      <cmh-header></cmh-header>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: `
    .page-wrapper {
      display: flex;
      flex-direction: column;
    }
  `
})
export class App
  implements OnInit {
  private readonly _http = inject(HttpClient);
  private readonly isClient = inject(IS_CLIENT);

  constructor() {
  }

  ngOnInit() {
    if (!this.isClient) return;

    this._http.get(
      environment.worker_url + '/api/csrf',
      {withCredentials: true}
    ).subscribe();
  }
}
