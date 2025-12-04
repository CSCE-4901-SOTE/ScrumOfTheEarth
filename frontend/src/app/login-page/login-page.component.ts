import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

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

  constructor(private http: HttpClient, private router: Router) {
    '✅ LoginPageComponent loaded'
  }

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
    this.http.post('http://localhost:8080/api/login', loginData, { responseType: 'text' })
      .subscribe({
        next: (res) => {
          alert('✅ Login successful!');
          // Store user info for navbar display
          try {
            sessionStorage.setItem('userEmail', this.email);
            // Default to farmer role locally; backend can return role later
            sessionStorage.setItem('userRole', 'farmer');
          } catch (e) {
            // ignore storage errors
          }
          setTimeout(() => this.router.navigate(['/dashboard']), 300);
        },
        error: (err) => {
          this.passwordError = err.error || 'Invalid email or password.';
        }
      });
  }
}
