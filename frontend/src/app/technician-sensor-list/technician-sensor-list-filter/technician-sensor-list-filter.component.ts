import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-technician-sensor-list-filter',
  imports: [FormsModule],
  templateUrl: './technician-sensor-list-filter.component.html',
  styleUrl: './technician-sensor-list-filter.component.css',
})
export class TechnicianSensorListFilterComponent {
  @Output() addSensorClick = new EventEmitter<void>();

  onAddSensor() {
    this.addSensorClick.emit();
  }
}
