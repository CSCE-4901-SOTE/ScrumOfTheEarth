import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as maplibregl from 'maplibre-gl';
import { SensorService, Sensor } from './sensor.service';
import { ContactService, Contact } from '../contacts/contact.service';

@Component({
  selector: 'app-map-sensor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './map-sensor.component.html',
  styleUrl: './map-sensor.component.css',
})
export class MapSensorComponent implements OnInit, OnDestroy {
  role: 'farmer' | 'technician' = 'farmer';
  userId: string | null = null;

  showAddSensorModal = false;
  addSensorError = '';

  isEditMode = false;
  editSensorId = '';

  showDeleteSensorModal = false;
  sensorToDelete: Sensor | null = null;
  deleteSensorError = '';

  contacts: Contact[] = [];
  sensors: Sensor[] = [];

  searchSensor = '';

  map: maplibregl.Map | null = null;
  selectedSensor: Sensor | null = null;

  batteryLevel = 100;
  batteryColorClass = 'green';

  tempValue = 0;
  moistValue = 0;
  lightValue = 0;

  tempColor = 'green';
  moistColor = 'green';
  lightColor = 'green';

  private markerMap = new Map<string, maplibregl.Marker>();

  THRESHOLDS = {
    temperature: { low: 60, idealMin: 70, idealMax: 85, high: 95 },
    moisture: { low: 20, idealMin: 30, idealMax: 60, high: 80 },
    light: { low: 20, idealMin: 40, idealMax: 70, high: 90 },
  };

  newSensor = {
    id: '',
    name: '',
    latitude: '',
    longitude: '',
    customerId: '',
    serialNumber: '',
  };

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private sensorService: SensorService,
    private contactService: ContactService
  ) {}

  // Safely get a value from sessionStorage in browser only.
  private safeGet(key: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;

    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  // Open add sensor modal and reset form state.
  openAddSensor(): void {
    this.isEditMode = false;
    this.editSensorId = '';
    this.addSensorError = '';

    this.newSensor = {
      id: '',
      name: '',
      latitude: '',
      longitude: '',
      customerId: '',
      serialNumber: '',
    };

    this.showAddSensorModal = true;
  }

  // Close add/edit sensor modal and clear error.
  closeAddSensor(): void {
    this.showAddSensorModal = false;
    this.addSensorError = '';
  }

  // Submit add or edit sensor form based on current mode.
  submitAddSensor(): void {
    if (this.isEditMode) {
      const payload = {
        name: this.newSensor.name.trim(),
        latitude: Number(this.newSensor.latitude),
        longitude: Number(this.newSensor.longitude),
        customerId: this.newSensor.customerId,
      };

      if (
        !this.editSensorId ||
        !payload.name ||
        !Number.isFinite(payload.latitude) ||
        !Number.isFinite(payload.longitude) ||
        !payload.customerId
      ) {
        this.addSensorError = 'Please fill in all required fields.';
        return;
      }

      this.sensorService.updateSensor(this.editSensorId, payload).subscribe({
        next: (updated) => {
          alert('✅ Sensor is successfully updated');
          this.addSensorError = '';

          this.sensors = this.sensors.map((s) =>
            s.id === this.editSensorId
              ? {
                  ...s,
                  ...updated,
                  serialNumber: s.serialNumber,
                }
              : s
          );

          if (this.selectedSensor?.id === this.editSensorId) {
            const current =
              this.sensors.find((s) => s.id === this.editSensorId) || null;
            this.selectedSensor = current;
            this.refreshSelectedSensorUI();
          }

          const current = this.sensors.find((s) => s.id === this.editSensorId);
          if (current) {
            this.updateMarker(current);
          }

          this.closeAddSensor();
        },
        error: (err) => {
          console.error('Update sensor failed', err);
          this.addSensorError =
            err?.error?.error || 'Failed to update sensor.';
        },
      });

      return;
    }

    const payload = {
      id: this.newSensor.id.trim(),
      name: this.newSensor.name.trim(),
      latitude: Number(this.newSensor.latitude),
      longitude: Number(this.newSensor.longitude),
      customerId: this.newSensor.customerId,
      technicianId: this.userId,
      serialNumber: this.newSensor.serialNumber.trim(),
    };

    if (
      !payload.id ||
      !payload.name ||
      !payload.serialNumber ||
      !Number.isFinite(payload.latitude) ||
      !Number.isFinite(payload.longitude) ||
      !payload.customerId ||
      !payload.technicianId
    ) {
      this.addSensorError = 'Please fill in all required fields.';
      return;
    }

    this.sensorService.addSensor(payload).subscribe({
      next: (created) => {
        alert('✅ Sensor is successfully added');
        this.closeAddSensor();

        this.addSensorError = '';
        this.sensors.push(created);

        if (this.map) {
          const marker = this.createMarker(created);
          if (marker) {
            marker.addTo(this.map);
            this.markerMap.set(created.id, marker);
          }
        }

        this.newSensor = {
          id: '',
          name: '',
          latitude: '',
          longitude: '',
          customerId: '',
          serialNumber: '',
        };
      },
      error: (err) => {
        console.error('Add sensor failed', err);
        this.addSensorError = err?.error?.error || 'Failed to add sensor.';
      },
    });
  }

  // Open edit mode and load selected sensor details into the form.
  editSelected(): void {
    if (!this.selectedSensor) return;

    const sensorId = this.selectedSensor.id;

    this.sensorService.getSensorById(sensorId).subscribe({
      next: (s) => {
        this.isEditMode = true;
        this.editSensorId = sensorId;
        this.addSensorError = '';

        this.newSensor = {
          id: s.id ?? '',
          name: s.name ?? '',
          latitude: String(s.latitude ?? ''),
          longitude: String(s.longitude ?? ''),
          customerId: (s as any).customerId ?? '',
          serialNumber: (s as any).serialNumber ?? '',
        };

        this.showAddSensorModal = true;
      },
      error: (err) => {
        console.error('Failed to load sensor detail:', err);
        this.addSensorError = 'Failed to load sensor details.';
      },
    });
  }

  // Open delete confirmation modal for a sensor.
  openDeleteSensor(sensor: Sensor): void {
    this.sensorToDelete = sensor;
    this.deleteSensorError = '';
    this.showDeleteSensorModal = true;
  }

  // Close delete modal and reset delete state.
  closeDeleteSensor(): void {
    this.showDeleteSensorModal = false;
    this.sensorToDelete = null;
    this.deleteSensorError = '';
  }

  // Delete selected sensor and remove it from map and list.
  confirmDeleteSensor(): void {
    if (!this.sensorToDelete) return;

    const sensorId = this.sensorToDelete.id;

    this.sensorService.deleteSensor(sensorId).subscribe({
      next: () => {
        this.sensors = this.sensors.filter((s) => s.id !== sensorId);

        const marker = this.markerMap.get(sensorId);
        if (marker) {
          marker.remove();
          this.markerMap.delete(sensorId);
        }

        if (this.selectedSensor?.id === sensorId) {
          this.selectedSensor = null;
        }

        this.closeDeleteSensor();
      },
      error: (err) => {
        console.error('Delete sensor failed', err);
        this.deleteSensorError =
          err?.error?.error || 'Failed to delete sensor.';
      },
    });
  }

  // Update battery color class based on battery percentage.
  updateBatteryColor(): void {
    if (this.batteryLevel > 60) {
      this.batteryColorClass = 'green';
    } else if (this.batteryLevel > 30) {
      this.batteryColorClass = 'yellow';
    } else if (this.batteryLevel > 15) {
      this.batteryColorClass = 'orange';
    } else {
      this.batteryColorClass = 'red';
    }
  }

  // Get UI color for a metric value based on thresholds.
  getBoxColor(type: string, value: number): string {
    const t = this.THRESHOLDS[type as keyof typeof this.THRESHOLDS];

    if (value < t.low) return 'red';
    if (value < t.idealMin) return 'yellow';
    if (value <= t.idealMax) return 'green';
    if (value < t.high) return 'yellow';
    return 'red';
  }

  // Refresh selected sensor detail values and colors.
  refreshSelectedSensorUI(): void {
    const s = this.selectedSensor;
    if (!s) return;

    this.batteryLevel = s.battery;
    this.updateBatteryColor();

    this.tempValue = s.temperature;
    this.moistValue = s.moisture;
    this.lightValue = s.light;

    this.tempColor = this.getBoxColor('temperature', s.temperature);
    this.moistColor = this.getBoxColor('moisture', s.moisture);
    this.lightColor = this.getBoxColor('light', s.light);
  }

  // Return filtered sensor list based on search text.
  get filteredSensors(): Sensor[] {
    const keyword = this.searchSensor.trim().toLowerCase();
    if (!keyword) return this.sensors;

    return this.sensors.filter((s) => {
      const name = (s.name ?? '').toLowerCase();
      const id = (s.id ?? '').toLowerCase();
      return name.includes(keyword) || id.includes(keyword);
    });
  }

  // Check whether current search has no matching results.
  get noResultFound(): boolean {
    return this.filteredSensors.length === 0 && this.searchSensor.trim() !== '';
  }

  // Load user info, contacts, sensors, and initialize map.
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const role = this.safeGet('role') as 'farmer' | 'technician' | null;
    const userId = this.safeGet('userId');

    if (!role || !userId) {
      console.error('Missing login info');
      this.sensors = [];
      this.initMap();
      return;
    }

    this.role = role;
    this.userId = userId;

    if (this.role === 'technician') {
      this.contactService.getContacts(this.userId).subscribe({
        next: (contacts: Contact[]) => {
          this.contacts = contacts ?? [];
        },
        error: (err: unknown) => {
          console.error('Failed to load contacts', err);
          this.contacts = [];
        },
      });
    }

    const req$ = this.sensorService.getLatestSensorsByRole(role, userId);

    req$.subscribe({
      next: (sensors) => {
        this.sensors = sensors ?? [];
        this.initMap();
      },
      error: (err) => {
        console.error(err);
        this.sensors = [];
        this.initMap();
      },
    });
  }

  // Clean up markers and map instance when component is destroyed.
  ngOnDestroy(): void {
    this.markerMap.forEach((m) => m.remove());
    this.markerMap.clear();

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // Initialize AWS MapLibre map and load markers.
  initMap(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const apiKey =
      'v1.public.eyJqdGkiOiI2MDM1MGM1NS01NTA2LTRiN2UtOTMyYi1lMjY2MGE4YzYxOTAifRCpWzRX3DXl_fDGk-Ot2SIc9KbxXaQ2ocnJ3uNYCPb3yWlrLF_GDLcype-t7GZe7hy09jWdPhk9SGTWh6B4of40o-sbQnRe_TKYUkypJ1B0LGh3NcF54lVHbsYjP7BZbXYLnD4W0hFtr7q5mRVMbYLsDZ9MfrDPVBWyxoWVsrvf4rp9DpxWQ3asaBIWxSsEcKDqRhI-Pqm03-Hmwi99r84QIcoo_wjF6MdupZbUFmiP4rCO8mLf1N1__aTUUeQpoHtwYRZ1lazKawvR09eVKnPrBtL_sQyLGZhxXYQPpDelPx1MqShVDLkcqn_h-9SbJPi3ngVhZqkezJ2R4B69FJk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx';
    const region = 'us-east-1';
    const style = 'Standard';
    const colorScheme = 'Light';

    try {
      if (this.map) {
        this.markerMap.forEach((m) => m.remove());
        this.markerMap.clear();
        this.map.remove();
        this.map = null;
      }

      this.map = new maplibregl.Map({
        container: 'sensor-map',
        style: `https://maps.geo.${region}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${colorScheme}`,
        center: [-97.091, 33.256],
        zoom: 16,
      });

      this.map.addControl(new maplibregl.NavigationControl(), 'top-left');

      this.map.on('load', () => {
        this.addMarkers(this.map!);
        this.fitToSensors();
      });
    } catch (err) {
      console.error('❌ Map initialization failed:', err);
    }
  }

  // Fit map bounds to all valid sensor coordinates.
  private fitToSensors(): void {
    if (!this.map) return;
    if (!this.sensors || this.sensors.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();
    let hasAny = false;

    for (const s of this.sensors) {
      const lat = Number((s as any).latitude);
      const lng = Number((s as any).longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (lat === 0 && lng === 0) continue;

      bounds.extend([lng, lat]);
      hasAny = true;
    }

    if (!hasAny) return;

    this.map.fitBounds(bounds, {
      padding: 80,
      maxZoom: 18,
    });
  }

  // Calculate current status from sensor lastSeen value.
  calculateStatus(sensor: Sensor): 'online' | 'weak' | 'offline' | 'deactivate' {
    const lastSeenRaw = (sensor as any).lastSeen;

    if (!lastSeenRaw) return 'deactivate';

    const now = new Date().getTime();
    const lastSeen = new Date(lastSeenRaw).getTime();
    const diff = now - lastSeen;

    const oneDay = 24 * 60 * 60 * 1000;
    const twoDays = 2 * 24 * 60 * 60 * 1000;

    if (diff < oneDay) return 'online';
    if (diff < twoDays) return 'weak';
    return 'offline';
  }

  // Get marker color based on sensor status.
  private getMarkerColor(status: string): string {
    if (status === 'online') return '#3c8e3f';
    if (status === 'offline') return '#e00e0e';
    if (status === 'weak') return '#e6b800';
    return '#777';
  }

  // Create a marker for one sensor and bind click behavior.
  private createMarker(sensor: Sensor): maplibregl.Marker | null {
    const lat = Number((sensor as any).latitude);
    const lng = Number((sensor as any).longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || (lat === 0 && lng === 0)) {
      console.warn('Invalid coordinates:', sensor.id, lat, lng);
      return null;
    }

    const marker = new maplibregl.Marker({
      color: this.getMarkerColor(this.calculateStatus(sensor)),
    }).setLngLat([lng, lat]);

    const el = marker.getElement();
    el.style.cursor = 'pointer';

    el.addEventListener('click', () => {
      this.selectedSensor = sensor;
      this.refreshSelectedSensorUI();
    });

    return marker;
  }

  // Remove old markers and render all sensor markers.
  addMarkers(map: maplibregl.Map): void {
    this.markerMap.forEach((m) => m.remove());
    this.markerMap.clear();

    this.sensors.forEach((sensor) => {
      const marker = this.createMarker(sensor);
      if (!marker) return;

      marker.addTo(map);
      this.markerMap.set(sensor.id, marker);
    });
  }

  // Replace one existing marker after sensor data changes.
  private updateMarker(sensor: Sensor): void {
    if (!this.map) return;

    const oldMarker = this.markerMap.get(sensor.id);
    if (oldMarker) oldMarker.remove();

    const newMarker = this.createMarker(sensor);
    if (!newMarker) return;

    newMarker.addTo(this.map);
    this.markerMap.set(sensor.id, newMarker);
  }

  // Move map focus to a specific sensor and update detail panel.
  focusSensor(sensor: Sensor): void {
    if (!this.map) return;

    this.selectedSensor = null;
    this.refreshSelectedSensorUI();

    this.map.flyTo({
      center: [sensor.longitude, sensor.latitude],
      zoom: 16,
      speed: 1.25,
    });
  }
}
