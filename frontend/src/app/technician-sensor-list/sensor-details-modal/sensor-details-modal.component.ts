import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sensor } from '../../map-sensor/sensor.service';
import { TechnicianSensor } from '../../models/technician-sensor.model';

@Component({
  selector: 'app-sensor-details-modal',
  imports: [CommonModule],
  templateUrl: './sensor-details-modal.component.html',
  styleUrl: './sensor-details-modal.component.css',
})
export class SensorDetailsModalComponent {
  @Input() sensor: TechnicianSensor | null = null;
  @Input() show = false;
  @Output() close = new EventEmitter<void>();
}