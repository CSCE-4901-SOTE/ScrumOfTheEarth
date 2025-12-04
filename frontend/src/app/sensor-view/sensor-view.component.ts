import { Component, computed, effect, inject, signal, WritableSignal } from '@angular/core';
import { SensorService } from '../services/sensor.service';
import { SensorViewTableComponent } from './sensor-view-table/sensor-view-table.component';
import { Sensor } from '../models/sensor.model';

@Component({
  selector: 'app-sensor-view',
  imports: [SensorViewTableComponent],
  templateUrl: './sensor-view.component.html',
  styleUrl: './sensor-view.component.css',
})
export class SensorViewComponent {
  sensorService: SensorService = inject(SensorService);

  sensors = computed(() => {return this.sensorService.techniciansSensors()});
  cleanedSensors: WritableSignal<Sensor[]> = signal<Sensor[]>([]);

  constructor() {
    effect(() => {
      const sensors = this.sensors();
      if(sensors) {
        this.cleanedSensors.set(sensors.content);
      }
    })
  }
}
