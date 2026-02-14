import {Component, inject, signal} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {User} from '@supabase/supabase-js';
import {BehaviorSubject, firstValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';

interface LoginData {
  email: string;
  password: string;
}


@Component({
  selector: 'app-root',
  imports: [
    FormField
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {

  private readonly _httpClient = inject(HttpClient);

  constructor() {
    this.getMe();
    this.getOrders();
  }

  loginModel = signal<LoginData>({
    email: '',
    password: '',
  });
  loginForm = form(this.loginModel);
  private currentUser = new BehaviorSubject<User | undefined>(undefined)

  onSubmit(event: Event) {
    event.preventDefault();
    // Perform login logic here
    const credentials = this.loginModel();
    this.signIn(credentials)
      .then((res) => {
        console.log('Login successful', res);

        this.getOrders();
      })
      .catch((err) => {
        console.error('Login failed', err);
      });
  }

  //
  // async loadUser() {
  //   if (this.currentUser.value) {
  //     // User is already set, no need to do anything else
  //     return
  //   }
  //   const user = await this.supabase.auth.getUser()
  //   console.log('LOAD USER', user)
  //
  //   if (user.data.user) {
  //     this.currentUser.next(user.data.user)
  //   } else {
  //     this.currentUser.next(undefined)
  //   }
  //
  //   this.getOrders();
  // }
  //
  // signUp(credentials: {
  //   email: string
  //   password: string
  // }) {
  //   return this.supabase.auth.signUp(credentials)
  // }

  signIn(credentials: {
    email: string
    password: string
  }) {
    return firstValueFrom(this._httpClient.post(' http://localhost:3333/api/auth/login', credentials, {withCredentials: true}));
  }

  //
  // sendPwReset(email: string) {
  //   return this.supabase.auth.resetPasswordForEmail(email)
  // }
  //
  // async signOut() {
  //   await this.supabase.auth.signOut()
  //   // this.router.navigateByUrl('/', {replaceUrl: true})
  // }
  //
  // getCurrentUser(): Observable<User | undefined> {
  //   return this.currentUser.asObservable()
  // }
  //
  // getCurrentUserId(): string {
  //   if (this.currentUser.value) {
  //     return (this.currentUser.value as User).id
  //   } else {
  //     return ''
  //   }
  // }
  //
  // signInWithEmail(email: string) {
  //   return this.supabase.auth.signInWithOtp({email})
  // }
  //
  async getOrders() {
    const orders = await firstValueFrom(this._httpClient.get('http://localhost:3333/api/admin/orders', {withCredentials: true}));

    console.log({orders})
  }

  async getMe() {
    const me = await firstValueFrom(this._httpClient.post('http://localhost:3333/api/auth/me', {}, {withCredentials: true}));

    console.log({me})
  }
}
