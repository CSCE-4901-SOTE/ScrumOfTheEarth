import { Routes } from '@angular/router';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HistoricalTrendsComponent } from './historical-trends/historical-trends.component';
import { AlertsComponent } from './alerts/alerts.component';
import { MapSensorComponent } from './map-sensor/map-sensor.component';
import { ContactsComponent } from './contacts/contacts.component';

export const routes: Routes = [
  { path: 'contacts', component: ContactsComponent },
  { path: 'signup-page', component: SignupPageComponent },
  { path: 'login-page', component: LoginPageComponent },
  { path: 'historical-trends', component: HistoricalTrendsComponent },
  { path: 'alerts', component: AlertsComponent },
  { path: 'map-sensor', component: MapSensorComponent },
  { path: '', redirectTo: 'signup-page', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent }
];

