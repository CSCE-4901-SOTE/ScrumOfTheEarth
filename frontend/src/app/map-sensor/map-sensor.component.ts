import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as maplibregl from 'maplibre-gl';
import { SensorService, Sensor } from './sensor.service';

@Component({
  selector: 'app-map-sensor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './map-sensor.component.html',
  styleUrl: './map-sensor.component.css'
})
export class MapSensorComponent implements OnInit {
  role: 'farmer' | 'technician' = 'farmer';
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private sensorService: SensorService
  ) {}

  private safeGet(key: string): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  searchSensor= '';
  map: maplibregl.Map | null = null;

  selectedSensor: Sensor | null = null;
  popupPosition: { x: number; y: number } = { x: 0, y: 0 };

  signalLevel = 2;
  batteryLevel = 100;  
  batteryColorClass = 'green';  

  // Keep marker refs to update color when status changes
  private markerMap = new Map<string, maplibregl.Marker>();

  THRESHOLDS = {
    temperature: { low: 60, idealMin: 70, idealMax: 85, high: 95 },
    moisture: { low: 20, idealMin: 30, idealMax: 60, high: 80 },
    light: { low: 5000, idealMin: 20000, idealMax: 70000, high: 90000 }
  };

  tempValue = 0;
  moistValue = 0;
  lightValue = 0;

  tempColor = 'green';
  moistColor = 'green';
  lightColor = 'green';

  sensors: Sensor[] = [];

  /* Converts RSSI (dBm) into a 1–5 signal strength level */
  convertDbmToLevel(dBm: number): number {
    return this.sensorService.convertDbmToLevel(dBm);
  }

  /* Returns human-readable text for the signal strength level */
  get signalLabel() {
    switch (this.signalLevel) {
      case 5: return 'Excellent';
      case 4: return 'Strong';
      case 3: return 'Medium';
      case 2: return 'Weak';
      default: return 'Offline';
    }
  }

  /* Converts raw packet loss % into severity level 0–5 */
  get packetLossLevel() {
    const loss = this.selectedSensor?.packetLoss || 0;

    if (loss >= 40) return 5;
    if (loss >= 25) return 4;
    if (loss >= 15) return 3;
    if (loss >= 8) return 2;
    if (loss > 0) return 1;
    return 0;
  }

  /* Returns descriptive text for packet loss severity */
  get packetLossLabel() {
    const lvl = this.packetLossLevel;
    if (lvl === 0) return 'No Loss';
    if (lvl === 1) return 'Very Low';
    if (lvl === 2) return 'Low';
    if (lvl === 3) return 'Medium';
    if (lvl === 4) return 'High';
    return 'Severe';
  }

  /* Updates battery color class depending on battery percentage */
  updateBatteryColor() {
    if (this.batteryLevel > 60) this.batteryColorClass = 'green';
    else if (this.batteryLevel > 30) this.batteryColorClass = 'yellow';
    else if (this.batteryLevel > 15) this.batteryColorClass = 'orange';
    else this.batteryColorClass = 'red';
  }

  /* Evaluates sensor reading (temp/moist/light) and returns box color */
  getBoxColor(type: string, value: number): string {
    const t = this.THRESHOLDS[type as keyof typeof this.THRESHOLDS];

    if (value < t.low) return 'red';
    if (value < t.idealMin) return 'yellow';
    if (value <= t.idealMax) return 'green';
    if (value < t.high) return 'yellow';
    return 'red';
  }

  // Sync UI values from selectedSensor
  refreshSelectedSensorUI() {
    const s = this.selectedSensor;
    if (!s) return;

    //Update signal level
    this.signalLevel = this.convertDbmToLevel(s.rssi);

    //Update battery level
    this.batteryLevel = s.battery;
    this.updateBatteryColor();

    this.tempValue = s.temperature;
    this.moistValue = s.moisture;
    this.lightValue = s.light;

    this.tempColor  = this.getBoxColor('temperature', s.temperature);
    this.moistColor = this.getBoxColor('moisture', s.moisture);
    this.lightColor = this.getBoxColor('light', s.light);
  }

  menuOpen = false; 
  toggleMenu() {
    this.menuOpen = !this.menuOpen;   // toggle true/false when clicked
  }

  /* Filters sensor list by search keyword (name or ID) */
  get filteredSensors() {
    const keyword = this.searchSensor.trim().toLowerCase();

    if (!keyword) return this.sensors;

    return this.sensors.filter(s => {
      const name = s.name.toLowerCase();
      const id = s.id.toLowerCase();

      return name.includes(keyword) || id.includes(keyword);
    });
  }

  /* Returns true if user typed something but no sensors match */
  get noResultFound() {
    return this.filteredSensors.length === 0 && this.searchSensor.trim() !== '';
  }

  /* Initializes map after component loads */
  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const role = this.safeGet('role') as 'farmer' | 'technician' | null;
    const userId = this.safeGet('userId');

    if (!role || !userId) {
      console.error('Missing login info');
      return;
    }

    this.role = role;

    const req$ =
      role === 'farmer'
        ? this.sensorService.getSensorsByCustomer(userId)
        : this.sensorService.getSensorsByTechnician(userId);

    req$.subscribe({
      next: (sensors) => {
        this.sensors = sensors ?? [];
        this.initMap();
      },
      error: (err) => {
        console.error(err);
        this.sensors = [];
        this.initMap();
      }
    });
  }


  /* Initializes the AWS MapLibre map instance */
  initMap(): void {
    // SSR guard
    if (!isPlatformBrowser(this.platformId)) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const apiKey =
      'v1.public.eyJqdGkiOiI2MDM1MGM1NS01NTA2LTRiN2UtOTMyYi1lMjY2MGE4YzYxOTAifRCpWzRX3DXl_fDGk-Ot2SIc9KbxXaQ2ocnJ3uNYCPb3yWlrLF_GDLcype-t7GZe7hy09jWdPhk9SGTWh6B4of40o-sbQnRe_TKYUkypJ1B0LGh3NcF54lVHbsYjP7BZbXYLnD4W0hFtr7q5mRVMbYLsDZ9MfrDPVBWyxoWVsrvf4rp9DpxWQ3asaBIWxSsEcKDqRhI-Pqm03-Hmwi99r84QIcoo_wjF6MdupZbUFmiP4rCO8mLf1N1__aTUUeQpoHtwYRZ1lazKawvR09eVKnPrBtL_sQyLGZhxXYQPpDelPx1MqShVDLkcqn_h-9SbJPi3ngVhZqkezJ2R4B69FJk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx';

    const region = 'us-east-1';
    const style = 'Standard';
    const colorScheme = 'Light';

    try {
      if (this.map) {
        this.markerMap.forEach(m => m.remove());
        this.markerMap.clear();
        this.map.remove();
        this.map = null;
      }

      this.map = new maplibregl.Map({
        container: 'sensor-map',
        style: `https://maps.geo.${region}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${colorScheme}`,
        center: [-97.0910, 33.2560],
        zoom: 16
      });

      this.map.addControl(new maplibregl.NavigationControl(), 'top-left');

      this.map.on('load', () => {
        this.addMarkers(this.map!);
      });

    } catch (err) {
      console.error('❌ Map initialization failed:', err);
    }
  }

  private fitToSensors() {
    if (!this.map) return;
    if (!this.sensors || this.sensors.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();

    let hasAny = false;
    for (const s of this.sensors) {
      const lat = Number((s as any).latitude);
      const lng = Number((s as any).longitude);

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        bounds.extend([lng, lat]);
        hasAny = true;
      }
    }

    if (!hasAny) return;

    this.map.fitBounds(bounds, {
      padding: 80,
      maxZoom: 18
    });
  }

  // Map status -> marker color
  private getMarkerColor(status: string) {
    if (status === 'online') return '#3c8e3f';
    if (status === 'offline') return '#e00e0e';
    if (status === 'weak') return '#e6b800';
    return '#777'; // deactivate
  }

  // Create marker and bind click -> open card
  private createMarker(sensor: Sensor) {
    const lat = Number((sensor as any).latitude);
    const lng = Number((sensor as any).longitude);
    const marker = new maplibregl.Marker({
      color: this.getMarkerColor(sensor.status)
    })
    .setLngLat([lng, lat]);

    const el = marker.getElement();
    el.style.cursor = 'pointer'; // Cursor pointer icon

    //Click marker to view big card
    el.addEventListener('click', () => {
      this.selectedSensor = sensor;
      this.refreshSelectedSensorUI();
    });

    return marker;
  }

  /* Adds all sensor markers to the map and attaches click event handlers */
  addMarkers(map: maplibregl.Map) {
    this.markerMap.forEach(m => m.remove());
    this.markerMap.clear();

    this.sensors.forEach(sensor => {
      const marker = this.createMarker(sensor).addTo(map);
      this.markerMap.set(sensor.id, marker);
    });
  }

  // Update marker color after status change
  private updateMarker(sensor: Sensor) {
    if (!this.map) return;

    const oldMarker = this.markerMap.get(sensor.id);
    if (oldMarker) oldMarker.remove();

    const newMarker = this.createMarker(sensor).addTo(this.map);
    this.markerMap.set(sensor.id, newMarker);
  }

  /* Moves the map camera to focus on a selected sensor marker */
  focusSensor(sensor: Sensor) {
    if (!this.map) return;

    this.map.flyTo({
      center: [sensor.longitude, sensor.latitude],
      zoom: 20,
      speed: 0.75
    });
  }

  /* Activates the selected sensor */
  activateSelected() {
    const s = this.selectedSensor;
    if (!s) return;

    this.sensorService.activateSensor(s.id).subscribe({
      next: (updated) => {
        // update selected + list
        this.selectedSensor = updated;
        const idx = this.sensors.findIndex(x => x.id === updated.id);
        if (idx !== -1) this.sensors[idx] = updated;

        this.refreshSelectedSensorUI();
        this.updateMarker(updated);
      },
      error: (err) => console.error('activate failed', err)
    });
  }

  /* Deactivates the selected sensor */
  deactivateSelected() {
    const s = this.selectedSensor;
    if (!s) return;

    this.sensorService.deactivateSensor(s.id).subscribe({
      next: (updated) => {
        this.selectedSensor = updated;
        const idx = this.sensors.findIndex(x => x.id === updated.id);
        if (idx !== -1) this.sensors[idx] = updated;

        this.refreshSelectedSensorUI();
        this.updateMarker(updated);
      },
      error: (err) => console.error('deactivate failed', err)
    });
  }

}
