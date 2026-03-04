import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment'; // adjust path if needed

const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css'],
})
export class LoginPageComponent {
  email = '';
  password = '';

  emailError = '';
  passwordError = '';

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async login() {
    this.emailError = '';
    this.passwordError = '';

    if (!this.email) this.emailError = 'Email is required.';
    if (!this.password) this.passwordError = 'Password is required.';
    if (this.emailError || this.passwordError) return;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: this.email,
      password: this.password,
    });

    if (error) {
      this.passwordError = error.message || 'Invalid email or password.';
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      this.passwordError = 'Login failed. Please try again.';
      return;
    }

    // Get role from your farmra_user table (role_id: 1 technician, 2 farmer)
    const { data: profile, error: profileErr } = await supabase
      .from('farmra_user')
      .select('role_id')
      .eq('user_id', userId)
      .single();

    if (profileErr || !profile?.role_id) {
      this.passwordError = 'Login succeeded, but profile was not found.';
      return;
    }

    const role = profile.role_id === 1 ? 'technician' : 'farmer';

    if (isPlatformBrowser(this.platformId)) {
      window.localStorage.setItem('userId', userId);
      window.localStorage.setItem('role', role);
    }

    setTimeout(() => this.router.navigate(['/dashboard']), 300);
  }
}