import { RouterLink, RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, RouterOutlet, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  // 🔹 Dropdown menu toggle
  menuOpen = false;
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }
}
