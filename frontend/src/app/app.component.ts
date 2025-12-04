import { Component } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  showNavbar = true;
  role = '';
  userName: string = '';

  menuOpen = false;     
  toggleMenu() {        
    this.menuOpen = !this.menuOpen;
  }

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const currentUrl = event.urlAfterRedirects;

        this.showNavbar = !(
          currentUrl.includes('/login-page') ||
          currentUrl.includes('/signup-page')
        );

        if (typeof window !== 'undefined') {
          this.role = (sessionStorage.getItem('userRole') || '').toLowerCase();
          const userEmail = sessionStorage.getItem('userEmail') || '';
          // display local part of email, capitalized
          if (userEmail) {
            const local = userEmail.split('@')[0];
            this.userName = local.charAt(0).toUpperCase() + local.slice(1);
          } else {
            this.userName = '';
          }
        }
      });
  }

  isFarmer() {
    return this.role === 'farmer';
  }

  isTechnician() {
    return this.role === 'technician';
  }
}
