import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  email = '';
  password = '';

  emailError = '';
  passwordError = '';

  backendUrl = environment.backendUrl

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  login() {
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

    const loginData = {
      email: this.email,
      passwordHash: this.password
    };

    // Send request POST to backend
    this.http.post<{ userId: string; role: 'farmer' | 'technician'; token: string; }>(this.backendUrl + '/login', loginData)
      .subscribe({
        next: (res) => {
          if (isPlatformBrowser(this.platformId)) {
            window.sessionStorage.setItem('userId', res.userId);
            window.sessionStorage.setItem('role', res.role);
            window.sessionStorage.setItem('token', res.token);
            //window.sessionStorage.setItem('fullName', res.fullName);
          }
          this.http.get<any>(`${this.backendUrl}/users/${res.userId}`).subscribe({
            next: (profile) => {
              if (profile.name) window.localStorage.setItem('userName', profile.name);
              if (profile.fullName) window.sessionStorage.setItem('fullName', profile.fullName);
              if (profile.profileImage) window.sessionStorage.setItem('profileImage', profile.profileImage);
            }
          });
          console.log('✅ Login successful!');
          setTimeout(() => this.router.navigate(['/dashboard']), 300);
        },
        error: (err) => {
          this.passwordError = err.error || 'Invalid email or password.';
        }
      });
  }
}
