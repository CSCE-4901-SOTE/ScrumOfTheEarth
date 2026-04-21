import { Component, Output, EventEmitter, Input, input, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Contact } from '../../contacts/contact.service';
import { SensorService } from '../../map-sensor/sensor.service';

@Component({
  selector: 'app-add-sensor-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './add-sensor-modal.component.html',
  styleUrl: './add-sensor-modal.component.css',
})
export class AddSensorModalComponent {
  show = input.required<boolean>();
  contacts = input.required<Contact[]>();
  userId = input.required<string | null>();
  @Output() close = new EventEmitter<void>();

  sensorService: SensorService = inject(SensorService);

  loading: boolean = false;
  addSensorError : string = '';

  newSensorForm = new FormGroup({
    name: new FormControl('', Validators.required),
    id: new FormControl('', Validators.required),
    customerName: new FormControl('', Validators.required),
    latitude: new FormControl(0, [Validators.required, Validators.min(-90), Validators.max(90)]),
    longitude: new FormControl(0, [Validators.required, Validators.min(-180), Validators.max(180)]),
    customerId: new FormControl('', Validators.required),
    serialNumber: new FormControl('', Validators.required),
  });

  // technicians attempts to add a sensor
  onSubmit() {
    if (!this.newSensorForm.valid) {
      return;
    }

    const formValues = this.newSensorForm.value;

    // Submit sensor. This is awfully sus but thats ok
    const payload = {
      id: formValues.id?.trim() ?? '',
      name: formValues.name?.trim() ?? '',
      latitude: formValues.latitude ?? 0,
      longitude: formValues.longitude ?? 0,
      customerId: formValues.customerId ?? '',
      technicianId: this.userId() ?? '',
      serialNumber: formValues.serialNumber?.trim() ?? ''
    };

    this.loading = true;

    this.sensorService.addSensor(payload).pipe(
      finalize(() => {
        this.loading = false;
        this.close.emit();
      })
    ).subscribe({
      next: (created) => {
        alert('Sensor added');

        // I guess a timer
        setTimeout(() => {
          this.close.emit();
        }, 3000);

        this.newSensorForm.reset();
        this.close.emit();
      },
      error: (err) => {
        console.error('Add sensor failed', err);

        this.addSensorError =
        err?.error?.error || 'Failed to add sensor.';
      },
    });
  }
}