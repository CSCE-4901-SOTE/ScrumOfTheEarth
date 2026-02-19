import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { SupabaseService } from './services/supabase.service';
import { isPlatformBrowser } from '@angular/common';

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

  constructor(
    private router: Router,
    private supabase: SupabaseService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const currentUrl = event.urlAfterRedirects;

        this.showNavbar = !(
          currentUrl.includes('/login-page') ||
          currentUrl.includes('/signup-page')
        );

        if (isPlatformBrowser(this.platformId)) {
          this.role = (localStorage.getItem('role') || '').toLowerCase();
          const userEmail = localStorage.getItem('userEmail') || '';
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

  async logout() {
    try {
      await this.supabase.signOut();
      if (isPlatformBrowser(this.platformId)) {
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        localStorage.removeItem('userEmail');
      }
      this.router.navigate(['/login-page']);
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if logout fails
      this.router.navigate(['/login-page']);
    }
  }
}
