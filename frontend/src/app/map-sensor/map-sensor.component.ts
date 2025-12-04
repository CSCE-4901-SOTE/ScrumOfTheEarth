import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import * as maplibregl from 'maplibre-gl';

@Component({
  selector: 'app-map-sensor',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './map-sensor.component.html',
  styleUrl: './map-sensor.component.css'
})
export class MapSensorComponent implements OnInit {
  searchSensor= '';
  map: any;
  selectedSensor: any = null; 
  popupPosition = { x: 0, y: 0 };
  signalLevel = 2;

  // Signal Strength
  convertDbmToLevel(dBm: number): number {
    if (dBm >= -55) return 5;
    if (dBm >= -65) return 4;
    if (dBm >= -75) return 3;
    if (dBm >= -85) return 2;
    return 1;
  }

  get signalLabel() {
    switch (this.signalLevel) {
      case 5: return 'Excellent';
      case 4: return 'Strong';
      case 3: return 'Medium';
      case 2: return 'Weak';
      default: return 'Offline';
    }
  }

  // Packet Loss Level
  get packetLossLevel() {
    const loss = this.selectedSensor?.packetLoss || 0;

    if (loss >= 40) return 5;
    if (loss >= 25) return 4;
    if (loss >= 15) return 3;
    if (loss >= 8) return 2;
    if (loss > 0) return 1;
    return 0;
  }

  get packetLossLabel() {
    const lvl = this.packetLossLevel;
    if (lvl === 0) return 'No Loss';
    if (lvl === 1) return 'Very Low';
    if (lvl === 2) return 'Low';
    if (lvl === 3) return 'Medium';
    if (lvl === 4) return 'High';
    return 'Severe';
  }

  menuOpen = false; 
  toggleMenu() {
    this.menuOpen = !this.menuOpen;   // ✅ toggle true/false when clicked
  }

  sensors = [
    {
      id: 'S001',
      name: 'Sensor 1',
      latitude: 33.2571,
      longitude: -97.0918,
      status: 'online',
      rssi: -82,
      packetLoss: 4 
    },
    {
      id: 'S002',
      name: 'Sensor 2',
      latitude: 33.2564,
      longitude: -97.0899,
      status: 'offline',
      rssi: -92,
      packetLoss: 27
    },
    {
      id: 'S003',
      name: 'Sensor 3',
      latitude: 33.2553,
      longitude: -97.0912,
      status: 'weak',
      rssi: -78,
      packetLoss: 12
    },
    {
      id: 'S004',
      name: 'Sensor 4',
      latitude: 33.2547,
      longitude: -97.0930,
      status: 'deactivate',
      rssi: -120,
      packetLoss: 0
    },
    {
      id: 'S005',
      name: 'Sensor 5',
      latitude: 33.2539,
      longitude: -97.0905,
      status: 'online',
      rssi: -60,
      packetLoss: 5
    },
    {
      id: 'S006',
      name: 'Sensor 6',
      latitude: 33.2560,
      longitude: -97.0937,
      status: 'online',
      rssi: -70,
      packetLoss: 18
    }
  ];

  /* Filter Function */
  get filteredSensors() {
    const keyword = this.searchSensor.trim().toLowerCase();

    if (!keyword) return this.sensors;

    return this.sensors.filter(s => {
      const name = s.name.toLowerCase();
      const id = s.id.toLowerCase();

      return name.includes(keyword) || id.includes(keyword);
    });
  }
  /* End Filter */

  // Search but no result
  get noResultFound() {
  return this.filteredSensors.length === 0 && this.searchSensor.trim() !== '';
  }

  // Map
  ngOnInit(): void {
    this.initMap();
  }

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

//Add Marker to the map
addMarkers(map: any) {
  this.sensors.forEach(sensor => {
    const marker = new maplibregl.Marker({
      color:
        sensor.status === 'online' ? '#3c8e3f' : 
        sensor.status === 'offline' ? '#e00e0e' :
        sensor.status === 'weak' ? '#e6b800' :
        '#777'   // deactivate
    })
      .setLngLat([sensor.longitude, sensor.latitude])
  
      .addTo(map);
      const el = marker.getElement();
      el.style.cursor = 'pointer'; // ⭐ Cursor pointer icon
      // ⭐ Click marker → big card
      marker.getElement().addEventListener('click', () => {
      this.selectedSensor = sensor;
      /* ⭐ UPDATE signalLevel dựa trên RSSI */
      this.signalLevel = this.convertDbmToLevel(sensor.rssi);
  });

  });
}
/*  End Marker  */

//Navigate to the clicked sensor list
 focusSensor(sensor: any) {
  if (!this.map) return;

  this.map.flyTo({
    center: [sensor.longitude, sensor.latitude],
    zoom: 20,
    speed: 0.75
  });
}



}
