import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AlertService } from './services/alert.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, RouterLink, RouterLinkActive, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  showNavbar = true;
  role = '';
  userName: string = '';
  unreadAlerts = 0;

  menuOpen = false;
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  constructor(private router: Router, private alertService: AlertService) {
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

  ngOnInit(): void {
    this.alertService.getAlerts().subscribe();
    this.alertService.unreadCount$.subscribe(count => this.unreadAlerts = count);
  }

  isFarmer() {
    return this.role === 'farmer';
  }

  isTechnician() {
    return this.role === 'technician';
  }
}
