import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { TechnicianSensorListFilterComponent } from "./technician-sensor-list-filter/technician-sensor-list-filter.component";
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SensorDetailsModalComponent } from './sensor-details-modal/sensor-details-modal.component';
import { AddSensorModalComponent } from './add-sensor-modal/add-sensor-modal.component';
import { Contact, ContactService } from '../contacts/contact.service';
import { Sensor, SensorService } from '../map-sensor/sensor.service';

@Component({
  selector: 'app-technician-sensor-list',
  imports: [TechnicianSensorListFilterComponent, CommonModule, SensorDetailsModalComponent, AddSensorModalComponent],
  templateUrl: './technician-sensor-list.component.html',
  styleUrl: './technician-sensor-list.component.css',
})
export class TechnicianSensorListComponent implements OnInit {
  SensorService: SensorService = inject(SensorService);
  ContactService: ContactService = inject(ContactService);
  platformId = inject(PLATFORM_ID);

  sensors: Sensor[] = [];
  contacts: Contact[] = [];
  userId: string | null = null;
  filteredSensors: Sensor[] = [];
  selectedSensor: Sensor | null = null;
  showSensorModal = false;
  showAddSensorModal = false;
  customerFilter = '';

  // Taken from Map sensor component. Thank you Phuong
  private safeGet(key: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  ngOnInit() {
    this.userId = this.safeGet('userId');

    if(this.userId) {
      this.loadSensors();
      this.ContactService.getContacts(this.userId).subscribe({
        next: (contacts: Contact[]) => {
          this.contacts = contacts ?? [];
        },
        error: (err: unknown) => {
          console.error('Failed to load contacts', err);
          this.contacts = [];
        }
      });
    }
    
  }

  loadSensors() {
    this.SensorService.getLatestSensorsByRole("technician",this.userId ?? "").subscribe({
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

  editSensor(sensor: Sensor) {
    this.openAddSensorModal();
  }

  openAddSensorModal() {
    this.showAddSensorModal = true;
  }

  closeAddSensorModal() {
    this.showAddSensorModal = false;
    this.loadSensors();
  }

  onCustomerFilterChange(filter: string) {
    this.customerFilter = filter;
    this.applyFilters();
  }

  applyFilters() {
    this.filteredSensors = this.sensors.filter(sensor =>
      !this.customerFilter ||
      sensor.customerName?.toLowerCase().includes(this.customerFilter.toLowerCase())
    );
  }
}
