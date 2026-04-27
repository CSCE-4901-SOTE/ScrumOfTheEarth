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

const guarded = { canActivate: [authGuard] };

export const routes: Routes = [
  { path: 'signup-page', component: SignupPageComponent },
  { path: 'login-page',  component: LoginPageComponent },
  { path: '', redirectTo: 'login-page', pathMatch: 'full' },
  { path: 'dashboard',    component: DashboardComponent,   ...guarded },
  { path: 'edit-profile', component: EditProfileComponent, ...guarded },
  { path: 'contacts',     component: ContactsComponent,    ...guarded },
  { path: 'report-page',  component: ReportPageComponent,  ...guarded },
  { path: 'alerts',       component: AlertsComponent,      ...guarded },
  { path: 'map-sensor',   component: MapSensorComponent,   ...guarded },
];

