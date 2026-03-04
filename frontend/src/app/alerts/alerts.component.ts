import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

type AlertItem = {
  id: string;
  title: string;
  sensorId: string;
  subtitle: string;
  message: string;
  sentLabel: string;
  read: boolean;
};

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts.component.html',
  styleUrl: './alerts.component.css',
})
export class AlertsComponent implements OnInit {
  //test alert
  alerts: AlertItem[] = [
    {
      id: 'test-1',
      title: 'TEST',
      sensorId: 'TEST',
      subtitle: 'Click to dismiss',
      message: 'Click the and it will go away.',
      sentLabel: 'just now',
      read: false,
    },
  ];

  unreadCount = 0;

  ngOnInit(): void {
    this.recomputeUnreadCount();
  }

  recomputeUnreadCount(): void {
    this.unreadCount = this.alerts.filter((a) => !a.read).length;
  }

  //call when clicked
  dismissAlert(id: string): void {
    this.alerts = this.alerts.filter((a) => a.id !== id);
    this.recomputeUnreadCount();
  }
} 