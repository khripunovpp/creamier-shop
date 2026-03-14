import {Component, inject, signal} from '@angular/core';
import {InputComponent} from '../shared/ui/controls/input.component';
import {HttpClient} from '@angular/common/http';
import {form, FormField, required, submit} from '@angular/forms/signals';
import {firstValueFrom} from 'rxjs';
import {ButtonComponent} from '../shared/ui/controls/button/button.component';
import {CardComponent} from '../shared/ui/card/card.component';
import {FlexColumnComponent} from '../shared/ui/layout/flex-column.component';
import {NotificationsService} from '../shared/services/notifications.service';
import {environment} from '../../env/environment';
import {Router} from '@angular/router';
import {RoutesEnum} from '../routes.enum';
import {ContainerComponent} from '../shared/ui/layout/container.component';
import {errorToString} from '../shared/helpers/errors.helper';

interface LoginData {
  email: string;
  password: string;
}

@Component({
  selector: 'cm-login',
  template: `
    <cm-container>
      <cm-card>
        <form (submit)="onSubmit($event)" novalidate>
          <cm-flex-column size="medium">
            <cm-flex-column size="small">
              <cm-input inputType="email"
                        placeholder="Email"
                        [formField]="loginForm.email"/>
              <cm-input inputType="password"
                        placeholder="Password"
                        [formField]="loginForm.password"/>
            </cm-flex-column>

            <cm-button type="submit">Log In</cm-button>
          </cm-flex-column>
        </form>
      </cm-card>
    </cm-container>
  `,
  styles: `
    :host {
      display: block;
      margin: auto;
      width: 100%;
      max-width: 400px;
    }
  `,
  imports: [
    InputComponent,
    FormField,
    ButtonComponent,
    CardComponent,
    FlexColumnComponent,
    ContainerComponent
  ]
})
export class LoginComponent {
  constructor() {
    this._httpClient.get(environment.worker_url + '/api/auth/csrf', {withCredentials: true}).subscribe();
  }

  private readonly _httpClient = inject(HttpClient);
  private readonly _notificationsService = inject(NotificationsService);
  private readonly _router = inject(Router);

  loginModel = signal<LoginData>({
    email: '',
    password: '',
  });
  loginForm = form(this.loginModel, (path) => {
    required(path.email);
    required(path.password);
  });

  signIn(credentials: {
    email: string
    password: string
  }) {
    return firstValueFrom(this._httpClient.post(
      environment.worker_url + '/api/auth/login',
      credentials,
      {withCredentials: true}
    ));
  }

  onSubmit(event: Event) {
    event.preventDefault();

    submit(this.loginForm, async () => {
      if (this.loginForm().invalid()) return;
      const credentials = this.loginModel();
      this.signIn(credentials)
        .then((res) => {
          this._router.navigate([RoutesEnum.dashboard]);
        })
        .catch((err) => {
          this._notificationsService.error(errorToString(err));
        });
    });
  }
}
