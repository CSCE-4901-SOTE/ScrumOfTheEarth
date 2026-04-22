import { Component, inject, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AlertService } from './services/alert.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  alertService = inject(AlertService);
  showNavbar = true;
  menuOpen = false;

  role: string = '';
  fullName: string = '';
  unreadAlerts = 0;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.updateSessionData();

      this.showNavbar = !(
        this.router.url.includes('/login-page') ||
        this.router.url.includes('/signup-page')
      );

      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe((event: any) => {
          const currentUrl = event.urlAfterRedirects;

          this.showNavbar = !(
            currentUrl.includes('/login-page') ||
            currentUrl.includes('/signup-page')
          );

          this.updateSessionData();
          this.closeMenu();
        });

      this.alertService.getAlerts().subscribe();
      this.alertService.unreadCount$.subscribe(count => this.unreadAlerts = count);
    }
  }

  updateSessionData(): void {
    this.role = (sessionStorage.getItem('role') || '').toLowerCase();
    this.fullName = sessionStorage.getItem('fullName') || '';
  }

  get displayRole(): string {
    if (this.role === 'farmer') return 'Farmer';
    if (this.role === 'technician') return 'Technician';
    return 'User';
  }

  isFarmer() {
    return this.role === 'farmer';
  }

  isTechnician(): boolean {
    return this.role === 'technician';
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }
}
