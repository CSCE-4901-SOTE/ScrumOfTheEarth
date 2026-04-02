import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Sensor } from '../../models/sensor.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sensor-details-modal',
  imports: [CommonModule],
  templateUrl: './sensor-details-modal.component.html',
  styleUrl: './sensor-details-modal.component.css',
})
export class SensorDetailsModalComponent {
  @Input() sensor: Sensor | null = null;
  @Input() show = false;
  @Output() close = new EventEmitter<void>();
}