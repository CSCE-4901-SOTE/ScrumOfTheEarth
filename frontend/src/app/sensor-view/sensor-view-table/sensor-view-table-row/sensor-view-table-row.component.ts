import { Component, input } from '@angular/core';
import { Sensor } from '../../../models/sensor.model';

@Component({
  selector: 'tr[app-sensor-view-table-row]',
  imports: [],
  templateUrl: './sensor-view-table-row.component.html',
  styleUrl: './sensor-view-table-row.component.css',
})
export class SensorViewTableRowComponent {
  sensorInformation = input.required<Sensor>();
}
