import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  email = '';
  password = '';

  emailError = '';
  passwordError = '';

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  async login() {
    this.emailError = '';
    this.passwordError = '';

    if (!this.email) {
      this.emailError = 'Email is required.';
    }

    if (!this.password) {
      this.passwordError = 'Password is required.';
    }

    if (this.emailError || this.passwordError) {
      return;
    }

    try {
      const { data, error } = await this.supabase.signIn(this.email, this.password);
      
      if (error) {
        this.passwordError = error.message || 'Invalid email or password.';
        return;
      }

      if (data.user) {
        // Fetch user profile to get role information
        const { data: profile, error: profileError } = await this.supabase.client
          .from('farmra_user')
          .select('role_id, user_role(name)')
          .eq('user_id', data.user.id)
          .single();

        if (profileError) {
          console.error('Failed to fetch user profile:', profileError);
          this.passwordError = 'Login successful but failed to load profile.';
          return;
        }

        // Store user info in localStorage
        if (isPlatformBrowser(this.platformId)) {
          window.localStorage.setItem('userId', data.user.id);
          window.localStorage.setItem('role', (profile as any).user_role?.name || 'farmer');
          window.localStorage.setItem('userEmail', this.email);
        }

        console.log('✅ Login successful!');
        setTimeout(() => this.router.navigate(['/dashboard']), 300);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      this.passwordError = err.message || 'Login failed. Please try again.';
    }
  }
}
