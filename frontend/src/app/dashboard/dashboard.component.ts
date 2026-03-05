import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
  inject,
  Signal,
  signal,
  computed,
} from '@angular/core';
import { RouterLink, RouterModule, RouterLinkActive } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import * as maplibregl from 'maplibre-gl';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MapSensorComponent } from '../map-sensor/map-sensor.component';
import { SensorService } from '../services/sensor.service';
import { Sensor } from '../models/sensor.model';
import { SensorInventory } from '../models/sensor-inventory.model';
import { lstatSync } from 'fs';
import { HardwareStatus } from '../models/hardware-status.model';
import { mapHardwareStatusToClass } from '../mappers/hardware-status-class.mapper';

interface Summary {
  activeNodes: number;
  activeDeltaToday: number; // number
  deactivatedNodes: number;
  deactivatedDeltaToday: number; // number
  unreadAlerts: number;
  alertDeltaLabel: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterModule,
    RouterLink,
    CommonModule,
    HttpClientModule,
    RouterLinkActive,
    MapSensorComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  sensorService = inject(SensorService);
  sensors: Sensor[] = []
  sensorInventory: SensorInventory[] = []
  statusLabel = mapHardwareStatusToClass;
  // 🔹 Dropdown menu toggle
  menuOpen = false;
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  role: string | null = null;

  lastUpdated: Date = new Date();
  private baselineActive = 0;
  private baselineDeactivated = 0;

  weatherData: any;
  rainChance: number | null = null;
  city: string = 'Denton';

  // markers (same idea as MapSensorComponent)
  private markerMap = new Map<string, maplibregl.Marker>();

  summary: Summary = {
    activeNodes: 0,
    activeDeltaToday: 0,
    deactivatedNodes: 0,
    deactivatedDeltaToday: 0,
    unreadAlerts: 5,
    alertDeltaLabel: 'no change',
  };

  // move to env later
  private weatherApiKey: string = '0b8120fcdfd87c4be96bb4a644287b3d';

  // keep reference (avoid re-init issues)
  private map: maplibregl.Map | null = null;

  // interval ref (to stop when leaving page)
  private liveTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.role =
        sessionStorage.getItem('role') || localStorage.getItem('role');
      console.log('User role:', this.role);
    }

    const req$ = this.sensorService.getSensors();
    /*
      role === 'farmer'
        ? this.sensorService.getSensorsByCustomer(userId)
        : this.sensorService.getSensorsByTechnician(userId);
    */

    req$.subscribe({
      next: (sensors) => {
        this.sensors = sensors ?? [];
        this.mapSensorToSensorInventory();
      },
      error: (err) => {
        console.error(err);
        this.sensors = [];
      }
    });

    // set baselines once (so delta works)
    this.baselineDeactivated = this.sensors.filter(
      (s) => s.status == HardwareStatus.DEACTIVATED
    ).length;
    this.baselineActive =
      this.sensors.length - this.baselineDeactivated;

    this.recomputeSummaryFromSensors();

    this.getWeather();

    // this.startFakeLiveSensors();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
  }

  ngOnDestroy(): void {
    if (this.liveTimer) {
      clearInterval(this.liveTimer);
      this.liveTimer = null;
    }

    // cleanup markers + map
    this.markerMap.forEach((m) => m.remove());
    this.markerMap.clear();

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // Role checks
  isFarmer(): boolean {
    return this.role === 'farmer';
  }

  isTechnician(): boolean {
    return this.role === 'technician';
  }

  mapSensorToSensorInventory() {
    const sensors = this.sensors;
    this.sensorInventory =  sensors.map((sensor) => {
      return {
        id: sensor.id,
        name: sensor.name,
        lastSeen: sensor.sensorReadings?.[0]?.createdAt ?? null,
        battery: sensor.battery,
        status: sensor.status,
        latitude: sensor.latitude,
        longitude: sensor.longitude
      };
    })
  }

  // =========================
  // Summary from sensors
  // Active = total - deactivated
  // Deactivated = deactivate
  // =========================
  private recomputeSummaryFromSensors(): void {
    const deactivated = this.sensorInventory.filter(
      (s) => s.status === HardwareStatus.DEACTIVATED
    ).length;

    const active = this.sensorInventory.length - deactivated;

    this.summary.activeNodes = active;
    this.summary.deactivatedNodes = deactivated;

    // delta number
    this.summary.activeDeltaToday = active - this.baselineActive;
    this.summary.deactivatedDeltaToday =
      deactivated - this.baselineDeactivated;
  }

  /*
  private startFakeLiveSensors(): void {
    // avoid double interval if component re-inits
    if (this.liveTimer) clearInterval(this.liveTimer);

    this.liveTimer = setInterval(() => {
      const idx = Math.floor(Math.random() * this.sensorInventory.length);
      const s = this.sensorInventory[idx];

      // 50% toggle deactivate, 50% update lastSeen/battery
      if (Math.random() < 0.5) {
        s.statusOverride =
          this.getSensorStatus(s) === 'deactivate' ? 'online' : 'deactivate';
      } else {
        s.lastSeen = new Date(
          Date.now() - Math.floor(Math.random() * 20) * 60000
        );
        s.battery = Math.floor(Math.random() * 101);
      }

      this.lastUpdated = new Date();
      this.recomputeSummaryFromSensors();

      // update markers too (same idea as MapSensor)
      this.addMarkers(this.map!);
    }, 5000);
  }
  */

  // Current Weather API
  getWeather(): void {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      this.city
    )}&appid=${this.weatherApiKey}&units=imperial`;

    this.http
      .get<any>(url)
      .pipe(
        catchError((err) => {
          console.error('❌ Error fetching weather data:', err);
          this.lastUpdated = new Date();
          return of(null);
        })
      )
      .subscribe((data) => {
        if (!data) {
          this.weatherData = null;
          this.rainChance = null;
          this.lastUpdated = new Date();
          return;
        }

        this.weatherData = data;

        const cityName = this.weatherData?.name || this.city;
        this.getForecast(cityName)
          .pipe(
            catchError((err) => {
              console.error('❌ Error fetching forecast data:', err);
              this.lastUpdated = new Date();
              return of(null);
            })
          )
          .subscribe((forecast) => {
            const pop = forecast?.list?.[0]?.pop; // 0..1
            this.rainChance =
              typeof pop === 'number' ? Math.round(pop * 100) : null;
            this.lastUpdated = new Date();
          });
      });
  }

  // Forecast API (for POP)
  getForecast(city: string) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
      city
    )}&appid=${this.weatherApiKey}&units=imperial`;

    return this.http.get<any>(url);
  }

  // Weather emoji
  getWeatherEmoji(): string {
    if (!this.weatherData) return '❔';

    const main = this.weatherData.weather[0].main;
    const icon = this.weatherData.weather[0].icon;
    const isNight = icon.includes('n');

    switch (main) {
      case 'Clear':
        return isNight ? '🌙' : '☀️';
      case 'Clouds':
        return '☁️';
      case 'Rain':
        return '🌧️';
      case 'Drizzle':
        return '🌦️';
      case 'Thunderstorm':
        return '⛈️';
      case 'Snow':
        return '🌨️';
      case 'Mist':
      case 'Smoke':
      case 'Haze':
      case 'Fog':
        return '🌫️';
      case 'Dust':
      case 'Sand':
      case 'Ash':
      case 'Tornado':
        return '🌪️';
      default:
        return '🌡️';
    }
  }

  /*
  // =========================
  // MARKERS (COPY STYLE FROM MapSensorComponent)
  // =========================

  // Map status -> marker color
  private getMarkerColor(status: string) {
    if (status === 'online') return '#3c8e3f';
    if (status === 'offline') return '#e00e0e';
    if (status === 'weak') return '#e6b800';
    return '#777'; // deactivate
  }

  // Create marker (dashboard: click optional)
  private createMarker(sensor: SensorRow) {
    const lat = Number((sensor as any).latitude);
    const lng = Number((sensor as any).longitude);

    const status = this.getSensorStatus(sensor);

    const marker = new maplibregl.Marker({
      color: this.getMarkerColor(status),
    }).setLngLat([lng, lat]);

    const el = marker.getElement();
    el.style.cursor = 'pointer';

    // Optional click
    el.addEventListener('click', () => {
      console.log('clicked sensor:', sensor.id);
    });

    return marker;
  }

  /* Adds all sensor markers to the map */
  /*
  addMarkers(map: maplibregl.Map) {
    if (!map) return;

    this.markerMap.forEach((m) => m.remove());
    this.markerMap.clear();

    this.sensorInventory.forEach((sensor) => {
      const marker = this.createMarker(sensor).addTo(map);
      this.markerMap.set(sensor.id, marker);
    });

    // debug
    console.log('Markers added:', this.markerMap.size);
  }

  // Update marker color after status change (same pattern)
  private updateMarker(sensor: SensorRow) {
    if (!this.map) return;

    const oldMarker = this.markerMap.get(sensor.id);
    if (oldMarker) oldMarker.remove();

    const newMarker = this.createMarker(sensor).addTo(this.map);
    this.markerMap.set(sensor.id, newMarker);
  }

  // =========================
  // Map init (same as your dashboard, but call addMarkers on load)
  // =========================
  initMap(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const container = document.getElementById('sensor-map');
    if (!container) {
      setTimeout(() => this.initMap(), 0);
      return;
    }

    // clear old map + markers
    if (this.map) {
      this.markerMap.forEach((m) => m.remove());
      this.markerMap.clear();
      this.map.remove();
      this.map = null;
    }

    const apiKey =
      'v1.public.eyJqdGkiOiI2MDM1MGM1NS01NTA2LTRiN2UtOTMyYi1lMjY2MGE4YzYxOTAifRCpWzRX3DXl_fDGk-Ot2SIc9KbxXaQ2ocnJ3uNYCPb3yWlrLF_GDLcype-t7GZe7hy09jWdPhk9SGTWh6B4of40o-sbQnRe_TKYUkypJ1B0LGh3NcF54lVHbsYjP7BZbXYLnD4W0hFtr7q5mRVMbYLsDZ9MfrDPVBWyxoWVsrvf4rp9DpxWQ3asaBIWxSsEcKDqRhI-Pqm03-Hmwi99r84QIcoo_wjF6MdupZbUFmiP4rCO8mLf1N1__aTUUeQpoHtwYRZ1lazKawvR09eVKnPrBtL_sQyLGZhxXYQPpDelPx1MqShVDLkcqn_h-9SbJPi3ngVhZqkezJ2R4B69FJk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx';
    const region = 'us-east-1';
    const style = 'Standard';
    const colorScheme = 'Light';

    try {
      this.map = new maplibregl.Map({
        container: 'sensor-map',
        style: `https://maps.geo.${region}.amazonaws.com/v2/styles/${style}/descriptor?key=${apiKey}&color-scheme=${colorScheme}`,
        center: [-97.1331, 33.2148],
        zoom: 11,
      });

      this.map.scrollZoom.disable();
      this.map.boxZoom.disable();
      this.map.doubleClickZoom.disable();
      this.map.touchZoomRotate.disable();
      this.map.keyboard.disable();

      //this.map.addControl(new maplibregl.NavigationControl(), 'top-left');

      setTimeout(() => this.map?.resize(), 0);

      this.map.on('load', () => {
        this.map?.resize();
        this.addMarkers(this.map!); // same as MapSensorComponent
      });

      this.map.on('error', (e: any) => {
        console.error('MAPLIBRE ERROR:', e?.error || e);
      });
    } catch (err) {
      console.error('❌ Failed to initialize map:', err);
    }
  }
  */
}
