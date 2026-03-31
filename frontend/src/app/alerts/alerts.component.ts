import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../services/alert.service';
import { AlertItem, AlertType } from '../models/alert.model';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.css',
})
export class AlertsComponent implements OnInit {
  alerts: AlertItem[] = [];
  unreadCount = 0;

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.alertService.getAlerts().subscribe(alerts => {
      this.alerts = alerts;
      this.recomputeUnreadCount();
    });
  }

  recomputeUnreadCount(): void {
    this.unreadCount = this.alerts.filter(a => !a.acknowledged).length;
  }

  dismissAlert(id: string): void {
    this.alertService.acknowledge(id).subscribe(() => {
      const alert = this.alerts.find(a => a.id === id);
      if (alert) alert.acknowledged = true;
      this.recomputeUnreadCount();
    });
  }

  alertTitle(type: AlertType): string {
    switch (type) {
      case 'LOW_MOISTURE': return 'Low Moisture';
      case 'HIGH_TEMPERATURE': return 'High Temperature';
      case 'LOW_BATTERY': return 'Low Battery';
      case 'LOW_SIGNAL': return 'Low Signal';
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString();
  }
}
