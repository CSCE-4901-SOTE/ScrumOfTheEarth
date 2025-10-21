import { Routes } from '@angular/router';
//import { SignupPageComponent } from './signup-page/signup-page.component';
import { LoginPageComponent } from './login-page/login-page.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
//  { path: 'signup-page', component: SignupPageComponent },
  { path: 'login-page', component: LoginPageComponent },
  { path: 'dashboard', component: DashboardComponent},
  { path: '', redirectTo: '/signup-page', pathMatch: 'full' }
];
