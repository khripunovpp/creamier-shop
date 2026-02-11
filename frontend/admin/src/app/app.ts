import {Component, signal} from '@angular/core';
import {form, FormField} from '@angular/forms/signals';
import {createClient, SupabaseClient, User} from '@supabase/supabase-js';
import {BehaviorSubject, Observable} from 'rxjs';

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
  constructor() {
    this.supabase = createClient(
      'https://cupnyljotziiwgcxaxbs.supabase.co',
      'sb_publishable_phNErjL4UYkQ43IzIub1Sg_QPYnMJ0e'
    )

    this.supabase.auth.onAuthStateChange((event, sess) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && sess) {
        console.log('SET USER')

        this.currentUser.next(sess!.user)
      } else {
        this.currentUser.next(undefined)
      }
    })

    // Trigger initial session load
    this.loadUser()
  }

  loginModel = signal<LoginData>({
    email: '',
    password: '',
  });
  loginForm = form(this.loginModel);
  private supabase: SupabaseClient
  private currentUser = new BehaviorSubject<User | undefined>(undefined)

  onSubmit(event: Event) {
    event.preventDefault();
    // Perform login logic here
    const credentials = this.loginModel();
    this.signIn(credentials)
      .then((res) => {
        console.log('Login successful', res);
      })
      .catch((err) => {
        console.error('Login failed', err);
      });
  }

  async loadUser() {
    if (this.currentUser.value) {
      // User is already set, no need to do anything else
      return
    }
    const user = await this.supabase.auth.getUser()
    console.log('LOAD USER', user)

    if (user.data.user) {
      this.currentUser.next(user.data.user)
    } else {
      this.currentUser.next(undefined)
    }
  }

  signUp(credentials: {
    email: string
    password: string
  }) {
    return this.supabase.auth.signUp(credentials)
  }

  signIn(credentials: {
    email: string
    password: string
  }) {
    return this.supabase.auth.signInWithPassword(credentials)
  }

  sendPwReset(email: string) {
    return this.supabase.auth.resetPasswordForEmail(email)
  }

  async signOut() {
    await this.supabase.auth.signOut()
    // this.router.navigateByUrl('/', {replaceUrl: true})
  }

  getCurrentUser(): Observable<User | undefined> {
    return this.currentUser.asObservable()
  }

  getCurrentUserId(): string {
    if (this.currentUser.value) {
      return (this.currentUser.value as User).id
    } else {
      return ''
    }
  }

  signInWithEmail(email: string) {
    return this.supabase.auth.signInWithOtp({email})
  }
}
