import { Routes } from '@angular/router';
import { SignupPageComponent } from './signup-page/signup-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ReportPageComponent } from './report-page/report-page.component';
import { AlertsComponent } from './alerts/alerts.component';
import { MapSensorComponent } from './map-sensor/map-sensor.component';
import { ContactsComponent } from './contacts/contacts.component';
import { EditProfileComponent } from './edit-profile/edit-profile.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: 'edit-profile', component: EditProfileComponent, canActivate: [authGuard] },
  { path: 'contacts', component: ContactsComponent, canActivate: [authGuard] },
  { path: 'signup-page', component: SignupPageComponent },
  { path: 'login-page', component: LoginPageComponent },
  { path: 'report-page', component: ReportPageComponent, canActivate: [authGuard] },
  { path: 'alerts', component: AlertsComponent, canActivate: [authGuard] },
  { path: 'map-sensor', component: MapSensorComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'signup-page', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
];

