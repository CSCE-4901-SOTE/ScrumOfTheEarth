import { Component, inject, input } from '@angular/core';
import { Sensor } from '../../models/sensor.model';
import { SensorViewTableRowComponent } from './sensor-view-table-row/sensor-view-table-row.component';

@Component({
  selector: 'app-sensor-view-table',
  imports: [SensorViewTableRowComponent],
  templateUrl: './sensor-view-table.component.html',
  styleUrl: './sensor-view-table.component.css',
})
export class SensorViewTableComponent {
  sensorsData = input.required<Sensor[]>();

  openModal() {
    
  }
}
