import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {  HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css']
})
export class SignupPageComponent {
  email = '';
  phone = '';
  role = '';
  password = '';
  confirmPassword = '';
  showSuccessMessage = false;

  // Separate error variables for each field
  emailError = '';
  phoneError = '';
  roleError = '';
  passwordError = '';

  constructor(private http: HttpClient, private router: Router) {}

  signup() {
    // Reset old errors
    this.emailError = '';
    this.phoneError = '';
    this.roleError = '';
    this.passwordError = '';

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.email)) {
      this.emailError = 'Invalid email address.';
    }

    // Phone validation
    if (!/^\d+$/.test(this.phone)) {
      this.phoneError = 'Phone must contain digits only.';
    }

    // Role validation
    if (!this.role) {
      this.roleError = 'Please select your role.';
    }

    // Password validation
    const strongPasswordPattern =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordPattern.test(this.password)) {
      this.passwordError = 'Password must be 8+ chars with uppercase, number, and symbol.';
    } else if (this.password !== this.confirmPassword) {
      this.passwordError = 'Passwords do not match.';
    }

    // Stop submission if any error exists
    if (this.emailError || this.phoneError || this.roleError || this.passwordError) {
      return;
    }

    // NEW: send data to backend
    const userData = {
      email: this.email,
      phone: this.phone,
      passwordHash: this.password,
      role: { name: this.role }  // backend reads "role.name"
    };

    this.http.post('http://localhost:8080/api/signup', userData)
      .subscribe({
        next: (res) => {
          this.showSuccessMessage = true;
          alert('✅ Account created successfully!');
          setTimeout(() =>this.router.navigate(['/login-page']),500);
        },
        error: (err) => {
          alert('❌ Signup failed: ' + err.error);
        }
      });
    }
}
