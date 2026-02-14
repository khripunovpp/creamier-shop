import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('../home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'home',
    loadComponent: () => import('../home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'order',
    loadComponent: () => import('../view/order/order.component').then(m => m.OrderComponent)
  },

];
