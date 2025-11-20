import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import * as maplibregl from 'maplibre-gl';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    CommonModule,
    HttpClientModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {

  role = '';
  weatherData: any;
  city: string = 'Denton';
  private weatherApiKey: string = '0b8120fcdfd87c4be96bb4a644287b3d';

  menuOpen: boolean = false;
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {

    if (typeof window !== 'undefined') {
      this.role = sessionStorage.getItem('userRole') || '';
    }

    this.getWeather();//fetch weather data
  }

  ngAfterViewInit(): void {
    this.initMap();//aws location map
  }

  //user roles
  isFarmer(): boolean {
    return this.role === 'farmer';
  }

  isTechnician(): boolean {
    return this.role === 'technician';
  }

  //weather fetch
  getWeather(): void {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${this.city}&appid=${this.weatherApiKey}&units=imperial`;

    this.http.get(url).subscribe({
      next: (data) => {
        this.weatherData = data;
        console.log('Weather data:', data);
      },
      error: (err) => {
        console.error('Error fetching weather data:', err);
      }
    });
  }

  //aws map
  initMap(): void {
    const apiKey = 'v1.public.eyJqdGkiOiI2MDM1MGM1NS01NTA2LTRiN2UtOTMyYi1lMjY2MGE4YzYxOTAifRCpWzRX3DXl_fDGk-Ot2SIc9KbxXaQ2ocnJ3uNYCPb3yWlrLF_GDLcype-t7GZe7hy09jWdPhk9SGTWh6B4of40o-sbQnRe_TKYUkypJ1B0LGh3NcF54lVHbsYjP7BZbXYLnD4W0hFtr7q5mRVMbYLsDZ9MfrDPVBWyxoWVsrvf4rp9DpxWQ3asaBIWxSsEcKDqRhI-Pqm03-Hmwi99r84QIcoo_wjF6MdupZbUFmiP4rCO8mLf1N1__aTUUeQpoHtwYRZ1lazKawvR09eVKnPrBtL_sQyLGZhxXYQPpDelPx1MqShVDLkcqn_h-9SbJPi3ngVhZqkezJ2R4B69FJk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx'; //map api key
    const region = 'us-east-1';
    const style = 'Standard';
    const colorScheme = 'Light';

    //map
    const map = new maplibregl.Map({
      container: 'sensor-map',
      style: `https://maps.geo.${region}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${colorScheme}`,
      center: [-97.1331, 33.2148], // Denton, TX
      zoom: 11
    });

    //zoom controls
    map.addControl(new maplibregl.NavigationControl(), 'top-left');
  }
}
