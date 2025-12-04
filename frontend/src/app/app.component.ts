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
          const r = sessionStorage.getItem('userRole') || '';
          this.role = r ? r.toLowerCase() : '';
          const userEmail = sessionStorage.getItem('userEmail') || '';
          this.userName = userEmail ? userEmail.split('@')[0] : '';
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
