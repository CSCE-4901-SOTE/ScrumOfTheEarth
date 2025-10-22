import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [CommonModule, FormsModule], 
  templateUrl: './signup-page.component.html',
  styleUrls: ['./signup-page.component.css']
})

export class SignupPageComponent { 
  email='';
  phone ='';
  role='';
  password='';
  confirmPassword='';
  showSuccessMessage=false;
  errorMessage='';

  constructor(private router: Router) {
     console.log('✅ SignupPageComponent loaded');
  }
  
  signup(){
    const form = document.querySelector('form');
    if (form) {
      form.querySelectorAll('input, select').forEach(el => el.dispatchEvent(new Event('blur')));
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailPattern.test(this.email)) return;
    
    if(!/^\d+$/.test(this.phone)) return;
    
    if(!this.role) return;

    if(this.password !== this.confirmPassword) return;

    this.errorMessage ="";
    this.showSuccessMessage = true;

    alert('✅ Account created successfully!');

    setTimeout(() => (this.router.navigate(['/login-page'])), 500);
  }
}
