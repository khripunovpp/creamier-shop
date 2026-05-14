import {RedirectCommand, Router, Routes} from '@angular/router';
import {inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../env/environment';
import {catchError, map, of} from 'rxjs';
import {ErrorPageComponent} from './errors/error-page.component';
import {orderBuilderCanDeactivate} from './orders/builder/order-builder.guard';

const authGuard = () => {
  const _httpClient = inject(HttpClient);
  const _router = inject(Router);
  return _httpClient.get(
    environment.worker_url + '/api/auth/me',
    {withCredentials: true}
  ).pipe(
    // Если запрос успешный, пользователь авторизован
    map(() => true),
    // Если запрос неуспешный, пользователь не авторизован
    catchError(() => {
      const loginPath = _router.parseUrl("/login");
      return of(new RedirectCommand(loginPath));
    }),
  );
}

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: '',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'stock',
        canActivate: [authGuard],
        loadComponent: () => import('./stock/items/stock-items.component').then(m => m.StockItemsComponent),
      },
      {
        path: 'stock/create',
        canActivate: [authGuard],
        loadComponent: () => import('./stock/builder/stock-builder.component').then(m => m.StockBuilderComponent),
      },
      {
        path: 'stock/:uuid',
        canActivate: [authGuard],
        loadComponent: () => import('./stock/builder/stock-builder.component').then(m => m.StockBuilderComponent),
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadComponent: () => import('./orders/overview/orders-overview.component').then(m => m.OrdersOverviewComponent),
      },
      {
        path: 'orders/create',
        canActivate: [authGuard],
        loadComponent: () => import('./orders/create/order-create.component').then(m => m.OrderCreateComponent),
      },
      {
        path: 'orders/:uuid',
        canActivate: [authGuard],
        canDeactivate: [orderBuilderCanDeactivate],
        loadComponent: () => import('./orders/builder/order-builder.component').then(m => m.OrderBuilderComponent),
      },
      {
        path: 'stock-sets',
        canActivate: [authGuard],
        loadComponent: () => import('./stock-sets/list/stock-set-list.component').then(m => m.StockSetListComponent),
      },
      {
        path: 'stock-sets/create',
        canActivate: [authGuard],
        loadComponent: () => import('./stock-sets/builder/stock-set-builder.component').then(m => m.StockSetBuilderComponent),
      },
      {
        path: 'stock-sets/:uuid',
        canActivate: [authGuard],
        loadComponent: () => import('./stock-sets/builder/stock-set-builder.component').then(m => m.StockSetBuilderComponent),
      },
    ]
  },
  {
    path: '**',
    component: ErrorPageComponent,
  }
];
