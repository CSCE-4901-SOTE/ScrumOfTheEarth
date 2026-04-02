import { Component, inject, OnInit } from '@angular/core';
import { SensorService } from '../services/sensor.service';
import { TechnicianSensorListFilterComponent } from "./technician-sensor-list-filter/technician-sensor-list-filter.component";
import { Sensor } from '../models/sensor.model';
import { CommonModule } from '@angular/common';
import { SensorDetailsModalComponent } from './sensor-details-modal/sensor-details-modal.component';
import { AddSensorModalComponent } from './add-sensor-modal/add-sensor-modal.component';

@Component({
  selector: 'app-technician-sensor-list',
  imports: [TechnicianSensorListFilterComponent, CommonModule, SensorDetailsModalComponent, AddSensorModalComponent],
  templateUrl: './technician-sensor-list.component.html',
  styleUrl: './technician-sensor-list.component.css',
})
export class TechnicianSensorListComponent implements OnInit {
  SensorService: SensorService = inject(SensorService);
  sensors: Sensor[] = [];
  filteredSensors: Sensor[] = [];
  selectedSensor: Sensor | null = null;
  showSensorModal = false;
  showAddSensorModal = false;
  customerFilter = '';

  ngOnInit() {
    this.loadSensors();
  }

  loadSensors() {
    this.SensorService.getSensors().subscribe({
      next: (sensors) => {
        this.sensors = sensors;
        this.filteredSensors = sensors;
      },
      error: (error) => {
        console.error('Error loading sensors:', error);
      }
    });
  }

  onRowClick(sensor: Sensor) {
    this.selectedSensor = sensor;
    this.showSensorModal = true;
  }

  closeSensorModal() {
    this.showSensorModal = false;
    this.selectedSensor = null;
  }

  openAddSensorModal() {
    this.showAddSensorModal = true;
  }

  closeAddSensorModal() {
    this.showAddSensorModal = false;
  }

  onAddSensor(sensorData: any) {
    console.log('Adding sensor:', sensorData);
    this.loadSensors();
  }

  onCustomerFilterChange(filter: string) {
    this.customerFilter = filter;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredSensors = this.sensors.filter(sensor =>
      !this.customerFilter ||
      sensor.customer?.name.toLowerCase().includes(this.customerFilter.toLowerCase())
    );
  }
}
