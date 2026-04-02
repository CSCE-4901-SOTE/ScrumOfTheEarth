import { Component, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-sensor-modal',
  imports: [FormsModule],
  templateUrl: './add-sensor-modal.component.html',
  styleUrl: './add-sensor-modal.component.css',
})
export class AddSensorModalComponent {
  @Input() show = false;
  @Output() close = new EventEmitter<void>();
  @Output() addSensor = new EventEmitter<any>();

  newSensor = {
    id: '',
    customerName: '',
    latitude: 0,
    longitude: 0
  };

  onSubmit() {
    if (this.newSensor.id && this.newSensor.customerName) {
      this.addSensor.emit(this.newSensor);
      this.close.emit();
    }
  }
}