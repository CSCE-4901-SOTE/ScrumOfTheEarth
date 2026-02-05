import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterModule, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import * as maplibregl from 'maplibre-gl';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterModule,
    RouterLink,
    CommonModule,
    HttpClientModule,
    RouterLinkActive,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  // 🔹 Dropdown menu toggle
  menuOpen = false;
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  // 🔹 User + Weather data
  role: string | null = null;
  weatherData: any;
  city: string = 'Denton';
  private weatherApiKey: string =
    '0b8120fcdfd87c4be96bb4a644287b3d'; // ⚠️ move to env later

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // ✅ Only access storage in browser
    if (typeof window !== 'undefined') {
      this.role =
        sessionStorage.getItem('role') || localStorage.getItem('role');
      console.log('User role:', this.role);
    } else {
      console.warn('Not running in browser — skipping role storage access');
    }

    this.getWeather();
    this.initMap(); // ✅ Now safe for SSR
  }

  // 🔹 Role checks
  isFarmer(): boolean {
    return this.role === 'farmer';
  }

  isTechnician(): boolean {
    return this.role === 'technician';
  }

  // 🔹 Weather API (with error handling)
  getWeather(): void {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${this.city}&appid=${this.weatherApiKey}&units=imperial`;

    this.http
      .get(url)
      .pipe(
        catchError((err) => {
          console.error('❌ Error fetching weather data:', err);
          return of(null); // prevent crash
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.weatherData = data;
            console.log('✅ Weather data:', data);
          } else {
            console.warn('⚠️ Weather data not available');
          }
        },
      });
  }

  // 🔹 AWS Map (with SSR safety)
  initMap(): void {
    // ✅ Skip map initialization if not in browser
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      console.warn('Not running in browser — skipping map initialization');
      return;
    }

    const apiKey =
      'v1.public.eyJqdGkiOiI2MDM1MGM1NS01NTA2LTRiN2UtOTMyYi1lMjY2MGE4YzYxOTAifRCpWzRX3DXl_fDGk-Ot2SIc9KbxXaQ2ocnJ3uNYCPb3yWlrLF_GDLcype-t7GZe7hy09jWdPhk9SGTWh6B4of40o-sbQnRe_TKYUkypJ1B0LGh3NcF54lVHbsYjP7BZbXYLnD4W0hFtr7q5mRVMbYLsDZ9MfrDPVBWyxoWVsrvf4rp9DpxWQ3asaBIWxSsEcKDqRhI-Pqm03-Hmwi99r84QIcoo_wjF6MdupZbUFmiP4rCO8mLf1N1__aTUUeQpoHtwYRZ1lazKawvR09eVKnPrBtL_sQyLGZhxXYQPpDelPx1MqShVDLkcqn_h-9SbJPi3ngVhZqkezJ2R4B69FJk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx';
    const region = 'us-east-1';
    const style = 'Standard';
    const colorScheme = 'Light';

    try {
      const map = new maplibregl.Map({
        container: 'sensor-map',
        style: `https://maps.geo.${region}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${colorScheme}`,
        center: [-97.1331, 33.2148], // Denton, TX
        zoom: 11,
      });

      // Add zoom/rotation controls
      map.addControl(new maplibregl.NavigationControl(), 'top-left');
    } catch (err) {
      console.error('❌ Failed to initialize map:', err);
    }
  }
}
