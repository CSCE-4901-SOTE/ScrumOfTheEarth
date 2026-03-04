import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment'; // adjust path if needed

const supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css'],
})
export class SignupPageComponent {
  email = '';
  phone = '';
  role: 'farmer' | 'technician' | '' = '';
  password = '';
  confirmPassword = '';
  showSuccessMessage = false;

  emailError = '';
  phoneError = '';
  roleError = '';
  passwordError = '';

  constructor(private router: Router) {}

  async signup() {
    // Reset old errors
    this.emailError = '';
    this.phoneError = '';
    this.roleError = '';
    this.passwordError = '';

    //Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(this.email)) this.emailError = 'Invalid email address.';

    //Phone validation
    if (!/^\d+$/.test(this.phone)) this.phoneError = 'Phone must contain digits only.';

    //Role validation
    if (!this.role) this.roleError = 'Please select your role.';

    // Password validation
    const strongPasswordPattern =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordPattern.test(this.password)) {
      this.passwordError = 'Password must be 8+ chars with uppercase, number, and symbol.';
    } else if (this.password !== this.confirmPassword) {
      this.passwordError = 'Passwords do not match.';
    }

    if (this.emailError || this.phoneError || this.roleError || this.passwordError) return;

    //Create Auth user in Supabase
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: this.email,
      password: this.password,
      options: {
        data: { phone: this.phone, role: this.role },
      },
    });

    if (signUpError) {
      alert('Signup failed: ' + signUpError.message);
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      alert('Account created, but no user id returned.');
      return;
    }

    //Get role_id from user_role
    const { data: roleRow, error: roleErr } = await supabase
      .from('user_role')
      .select('role_id')
      .eq('name', this.role)
      .single();

    if (roleErr || !roleRow?.role_id) {
      alert('Account created, but role lookup failed: ' + (roleErr?.message ?? 'No role found'));
      return;
    }

    // 3) Insert into farmra_user (NO password_hash)
    const { error: insertErr } = await supabase.from('farmra_user').insert({
      user_id: userId,
      email: this.email,
      phone: this.phone,
      role_id: roleRow.role_id,
      // password_hash omitted on purpose
      // created_at auto-fills if default is set
    });

    if (insertErr) {
      alert('Auth user created, but farmra_user insert failed: ' + insertErr.message);
      return;
    }

    alert('Account created!');
    setTimeout(() => this.router.navigate(['/login-page']), 500);
  }
}