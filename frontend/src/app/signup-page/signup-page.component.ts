import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css']
})
export class SignupPageComponent {
  email = '';
  phone = '';
  role = '';
  firstName = '';
  lastName = '';
  password = '';
  confirmPassword = '';
  showSuccessMessage = false;

  // Separate error variables for each field
  emailError = '';
  phoneError = '';
  roleError = '';
  firstNameError = '';
  lastNameError = '';
  passwordError = '';

  constructor(private supabase: SupabaseService, private router: Router) {}

  async signup() {
    // Reset old errors
    this.emailError = '';
    this.phoneError = '';
    this.roleError = '';
    this.firstNameError = '';
    this.lastNameError = '';
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

    // First name validation
    if (!this.firstName.trim()) {
      this.firstNameError = 'First name is required.';
    }

    // Last name validation
    if (!this.lastName.trim()) {
      this.lastNameError = 'Last name is required.';
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
    if (this.emailError || this.phoneError || this.roleError || this.firstNameError || this.lastNameError || this.passwordError) {
      return;
    }

    // NEW: Use Supabase Auth for signup
    try {
      const { data, error } = await this.supabase.signUp(this.email, this.password);
      
      if (error) {
        this.emailError = error.message || 'Signup failed.';
        return;
      }

      // If signup successful, also create user profile in farmra_user table
      if (data.user) {
        // Small delay to ensure auth context is established
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get role ID from role name
        const roleId = this.role === 'farmer' ? 2 : 1; // 1=technician, 2=farmer based on our seed data
        
        const { error: profileError } = await this.supabase.client
          .from('farmra_user')
          .insert({
            user_id: data.user.id,
            email: this.email,
            first_name: this.firstName.trim(),
            last_name: this.lastName.trim(),
            phone: this.phone,
            role_id: roleId
          });

        if (profileError) {
          console.error('Profile creation failed:', profileError);
          this.emailError = 'Account created but profile setup failed. Please contact support.';
          return;
        }
      }

      this.showSuccessMessage = true;
      console.log('✅ Account created successfully! Please check your email to confirm your account.');
      setTimeout(() => this.router.navigate(['/login-page']), 500);
    } catch (err: any) {
      console.error('Signup error:', err);
      this.emailError = err.message || 'Signup failed. Please try again.';
    }
    }
}
