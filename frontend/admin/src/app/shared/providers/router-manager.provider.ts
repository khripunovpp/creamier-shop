import {InjectionToken} from '@angular/core';
import {Router} from '@angular/router';

export const ROUTER_MANAGER = new InjectionToken<{
  replace: (command: any[] | any) => Promise<any>
  navigateWithReset: (command: any[] | any) => void
  navigate: (command: any[] | any) => void
}>('RouterManager');

export const ROUTER_MANAGER_PROVIDER = {
  provide: ROUTER_MANAGER,
  useFactory: (
    router: Router
  ) => {
    return {
      navigateWithReset: async function (command: any[] | any) {
        this.navigate(command);
        this.replace(command);
      },
      replace: function (command: any[] | any) {
        return router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
          return router.navigate([router.createUrlTree(command).toString()]);
        });
      },
      navigate: function (command: any[] | any) {
        router.navigate(command);
      }
    }
  },
  deps: [
    Router
  ]
};
