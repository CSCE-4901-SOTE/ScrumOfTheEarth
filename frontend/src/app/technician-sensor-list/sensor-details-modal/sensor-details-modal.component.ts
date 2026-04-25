import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sensor } from '../../map-sensor/sensor.service';

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
  @Output() edit = new EventEmitter<Sensor>();

  onEdit() {
    this.close.emit();
    const s = this.sensor;
    if(s) {
      this.edit.emit(s);
    }
  }

  latitudeToString(latitude: number) {
    if(latitude > 0) {
      return latitude + "°N";
    } else if (latitude < 0) {
      return (latitude * -1) + "°S";
    } else {
      return latitude + "°";
    }
    return latitude;
  }

  longitudeToString(longitude: number) {
    if(longitude > 0) {
      return longitude + "°E";
    } else if (longitude < 0) {
      return (longitude * -1) + "°W";
    } else {
      return longitude + "°";
    }
    return longitude;
  }
}