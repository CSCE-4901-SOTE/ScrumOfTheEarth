import { Routes } from '@angular/router';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HistoricalTrendsComponent } from './historical-trends/historical-trends.component';
import { AlertsComponent } from './alerts/alerts.component';
import { MapSensorComponent } from './map-sensor/map-sensor.component';

export const routes: Routes = [
  { path: 'signup-page', component: SignupPageComponent },
  { path: 'login-page', component: LoginPageComponent },
  { path: 'historical-trends', component: HistoricalTrendsComponent },
  { path: 'alerts', component: AlertsComponent },   // ✔ FIXED
  { path: 'map-sensor', component: MapSensorComponent },
  { path: '', redirectTo: 'signup-page', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent }
];

