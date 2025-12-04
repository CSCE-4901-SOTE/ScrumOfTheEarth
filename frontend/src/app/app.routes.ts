import { Routes } from '@angular/router';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HistoricalTrendsComponent } from './historical-trends/historical-trends.component';
import { AlertsComponent } from './alerts/alerts.component';
import { MapSensorComponent } from './map-sensor/map-sensor.component';
import { ContactsComponent } from './contacts/contacts.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { SensorViewComponent } from './sensor-view/sensor-view.component';

export const routes: Routes = [
  { path: 'edit-profile', component: EditProfileComponent},
  { path: 'contacts', component: ContactsComponent },
  { path: 'signup-page', component: SignupPageComponent },
  { path: 'login-page', component: LoginPageComponent },
  { path: 'historical-trends', component: HistoricalTrendsComponent },
  { path: 'alerts', component: AlertsComponent },
  { path: 'map-sensor', component: MapSensorComponent },
  { path: 'sensors', component: SensorViewComponent },
  { path: '', redirectTo: 'signup-page', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent }
];

