import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import * as maplibregl from 'maplibre-gl';

@Component({
  selector: 'app-map-sensor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './map-sensor.component.html',
  styleUrl: './map-sensor.component.css'
})
export class MapSensorComponent implements OnInit {
  role: 'farmer' | 'technician' = 'farmer';
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  searchSensor= '';
  map: any;

  selectedSensor: any = null; 
  popupPosition = { x: 0, y: 0 };

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

  /* Converts RSSI (dBm) into a 1–5 signal strength level */
  convertDbmToLevel(dBm: number): number {
    if (dBm >= -55) return 5;
    if (dBm >= -65) return 4;
    if (dBm >= -75) return 3;
    if (dBm >= -85) return 2;
    return 1;
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

  // Compute online/weak/offline from stored readings
  computeStatusFromData(sensor: any): 'online' | 'offline' | 'weak' {
  const lvl = this.convertDbmToLevel(sensor.rssi);
  if (lvl <= 1) return 'offline'; // very weak/no link
  if (lvl <= 2) return 'weak';    // weak link
  return 'online';               // good link
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
    this.menuOpen = !this.menuOpen;   // ✅ toggle true/false when clicked
  }

  //Sensor fake data
  sensors = [
    {
      id: 'S001',
      name: 'Sensor 1',
      latitude: 33.2571,
      longitude: -97.0918,
      status: 'weak',
      rssi: -82,
      packetLoss: 4,
      battery: 78,
      temperature: 75,  
      moisture: 25,     
      light: 3000,
      savedState: null
    },
    {
      id: 'S002',
      name: 'Sensor 2',
      latitude: 33.2564,
      longitude: -97.0899,
      status: 'offline',
      rssi: -92,
      packetLoss: 27,
      battery: 22,
      temperature: 95,   
      moisture: 85,      
      light: 25000,
      savedState: null
    },
    {
      id: 'S003',
      name: 'Sensor 3',
      latitude: 33.2553,
      longitude: -97.0912,
      status: 'weak',
      rssi: -78,
      packetLoss: 12,
      battery: 45,
      temperature: 55,   
      moisture: 50,      
      light: 75000,
      savedState: null
    },
    {
      id: 'S004',
      name: 'Sensor 4',
      latitude: 33.2547,
      longitude: -97.0930,
      status: 'deactivate',
      rssi: -120,
      packetLoss: 0,
      battery: 0,
      temperature: 88,    
      moisture: 10,       
      light: 45000,
      savedState: {
        status: 'weak',
        rssi: -84,
        packetLoss: 18,
        battery: 40,
        temperature: 88,
        moisture: 10,
        light: 45000
      }
    },
    {
      id: 'S005',
      name: 'Sensor 5',
      latitude: 33.2539,
      longitude: -97.0905,
      status: 'online',
      rssi: -60,
      packetLoss: 5,
      battery: 91,
      temperature: 72,    
      moisture: 15,       
      light: 85000,
      savedState: null
    },
    {
      id: 'S006',
      name: 'Sensor 6',
      latitude: 33.2560,
      longitude: -97.0937,
      status: 'online',
      rssi: -70,
      packetLoss: 18,
      battery: 63,
      temperature: 100,   
      moisture: 35,       
      light: 15000,
      savedState: null
    },
    {
      id: 'S007',
      name: 'Sensor 7',
      latitude: 33.2578,
      longitude: -97.0922,
      status: 'online',
      rssi: -68,
      packetLoss: 7,
      battery: 72,
      temperature: 82,   
      moisture: 65,      
      light: 95000,
      savedState: null
    },
    {
      id: 'S008',
      name: 'Sensor 8',
      latitude: 33.2583,
      longitude: -97.0901,
      status: 'weak',
      rssi: -84,
      packetLoss: 18,
      battery: 40,
      temperature: 68,    
      moisture: 40,        
      light: 12000,
      savedState: null
    },
    {
      id: 'S009',
      name: 'Sensor 9',
      latitude: 33.2549,
      longitude: -97.0914,
      status: 'offline',
      rssi: -110,
      packetLoss: 42,
      battery: 8,
      temperature: 52,     
      moisture: 85,         
      light: 60000,
      savedState: null
    },
    {
      id: 'S010',
      name: 'Sensor 10',
      latitude: 33.2557,
      longitude: -97.0941,
      status: 'online',
      rssi: -72,
      packetLoss: 10,
      battery: 57,
      temperature: 88,       
      moisture: 28,          
      light: 30000,
      savedState: null
    }
  ];

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
    if (isPlatformBrowser(this.platformId)) {
      const savedRole = localStorage.getItem('role');
      this.role = savedRole === 'technician' ? 'technician' : 'farmer';
    } else {
      this.role = 'farmer';
    }
    this.initMap();
  }

  /* Initializes the AWS MapLibre map instance */
  initMap(): void {
    // Prevent SSR issues
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const apiKey =
      'v1.public.eyJqdGkiOiI2MDM1MGM1NS01NTA2LTRiN2UtOTMyYi1lMjY2MGE4YzYxOTAifRCpWzRX3DXl_fDGk-Ot2SIc9KbxXaQ2ocnJ3uNYCPb3yWlrLF_GDLcype-t7GZe7hy09jWdPhk9SGTWh6B4of40o-sbQnRe_TKYUkypJ1B0LGh3NcF54lVHbsYjP7BZbXYLnD4W0hFtr7q5mRVMbYLsDZ9MfrDPVBWyxoWVsrvf4rp9DpxWQ3asaBIWxSsEcKDqRhI-Pqm03-Hmwi99r84QIcoo_wjF6MdupZbUFmiP4rCO8mLf1N1__aTUUeQpoHtwYRZ1lazKawvR09eVKnPrBtL_sQyLGZhxXYQPpDelPx1MqShVDLkcqn_h-9SbJPi3ngVhZqkezJ2R4B69FJk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx';

    const region = 'us-east-1';
    const style = 'Standard';
    const colorScheme = 'Light';

    try {
      this.map = new maplibregl.Map({
        container: 'sensor-map',
        style: `https://maps.geo.${region}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${colorScheme}`,
        center: [-97.0910, 33.2560],  // Denton area
        zoom: 16
      });

      this.map.addControl(new maplibregl.NavigationControl(), 'top-left');
      this.addMarkers(this.map);
    } catch (err) {
      console.error('❌ Map initialization failed:', err);
    }
  }

  // Map status -> marker color
  private getMarkerColor(status: string) {
    return status === 'online' ? '#3c8e3f' :
           status === 'offline' ? '#e00e0e' :
           status === 'weak' ? '#e6b800' :
           '#777'; // deactivate
  }

  // Create marker and bind click -> open card
  private createMarker(sensor: any) {
    const marker = new maplibregl.Marker({
      color: this.getMarkerColor(sensor.status)
    })
    .setLngLat([sensor.longitude, sensor.latitude]);

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
  addMarkers(map: any) {
    this.sensors.forEach(sensor => {
      const marker = this.createMarker(sensor).addTo(map);
      this.markerMap.set(sensor.id, marker);
    });
  }

  // Update marker color after status change
  private updateMarker(sensor: any) {
    if (!this.map) return;

    const oldMarker = this.markerMap.get(sensor.id);
    if (oldMarker) oldMarker.remove();

    const newMarker = this.createMarker(sensor).addTo(this.map);
    this.markerMap.set(sensor.id, newMarker);
  }

  /* Moves the map camera to focus on a selected sensor marker */
  focusSensor(sensor: any) {
    if (!this.map) return;

    this.map.flyTo({
      center: [sensor.longitude, sensor.latitude],
      zoom: 20,
      speed: 0.75
    });
  }

  /* Activates the selected sensor */
  activateSelected() {
    if (!this.selectedSensor) return;
    if (this.selectedSensor.status !== 'deactivate') return;

    const saved = this.selectedSensor.savedState;

    // Restore last-known values
    if (saved) {
      this.selectedSensor.rssi = saved.rssi;
      this.selectedSensor.packetLoss = saved.packetLoss;
      this.selectedSensor.battery = saved.battery;
      this.selectedSensor.temperature = saved.temperature;
      this.selectedSensor.moisture = saved.moisture;
      this.selectedSensor.light = saved.light;
    }

    // Restore status color from data
    this.selectedSensor.status = this.computeStatusFromData(this.selectedSensor);

    this.refreshSelectedSensorUI();
    this.updateMarker(this.selectedSensor);
  }

  deactivateSelected() {
    if (!this.selectedSensor) return;
    if (this.selectedSensor.status === 'deactivate') return;

    // Save current values for restore on Activate
    this.selectedSensor.savedState = {
      status: this.selectedSensor.status,
      rssi: this.selectedSensor.rssi,
      packetLoss: this.selectedSensor.packetLoss,
      battery: this.selectedSensor.battery,
      temperature: this.selectedSensor.temperature,
      moisture: this.selectedSensor.moisture,
      light: this.selectedSensor.light
    };

    this.selectedSensor.status = 'deactivate';

    // Fake "power off" values
    this.selectedSensor.rssi = -120;
    this.selectedSensor.packetLoss = 0;
    this.selectedSensor.battery = 0;

    this.refreshSelectedSensorUI();
    this.updateMarker(this.selectedSensor);
  }
}
