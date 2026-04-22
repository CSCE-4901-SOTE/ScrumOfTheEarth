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
import { FormsModule } from '@angular/forms';
import * as maplibregl from 'maplibre-gl';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { MapSensorComponent } from '../map-sensor/map-sensor.component';
import { Sensor } from '../models/sensor.model';
import { SensorInventory } from '../models/sensor-inventory.model';
import { lstatSync } from 'fs';
import { HardwareStatus } from '../models/hardware-status.model';
import { mapHardwareStatusToClass } from '../mappers/hardware-status-class.mapper';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart,
  ChartData,
  ChartOptions,
  registerables,
} from 'chart.js';
import { environment } from '../../environments/environment';
import { AlertService } from '../services/alert.service';

Chart.register(...registerables);

type SensorStatus = 'online' | 'offline' | 'weak' | 'deactivate';

interface SensorRow {
  id: string;
  name: string;
  lastSeen: Date | null;
  battery: number | null;
  latitude: number;
  longitude: number;
  temperature: number;
  moisture: number;
  light: number;
}

interface Summary {
  activeNodes: number;
  activeDeltaToday: number;
  deactivatedNodes: number;
  deactivatedDeltaToday: number;
  unreadAlerts: number;
  alertDeltaLabel: string;
}

interface SensorLatestApiRow {
  node_id: string;
  node_name: string;
  latitude: number | null;
  longitude: number | null;
  node_status: string | null;
  temperature: number | null;
  moisture: number | null;
  light: number | null;
  battery: number | null;
  last_reading_at: string | null;
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
    MapSensorComponent,
    FormsModule,
    BaseChartDirective,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  sensors: Sensor[] = [];
  statusLabel = mapHardwareStatusToClass;
  apiBase = environment.backendUrl;

  menuOpen = false;
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  role: string | null = null;
  fullName: string | null = null;

  lastUpdated: Date = new Date();
  private baselineInitialized = false;
  private baselineActive = 0;
  private baselineDeactivated = 0;
  private baselineKey: string | null = null;
  private hasFittedOnce = false;

  weatherData: any;
  rainChance: number | null = null;
  city: string = 'Denton';

  private markerMap = new Map<string, maplibregl.Marker>();

  summary: Summary = {
    activeNodes: 0,
    activeDeltaToday: 0,
    deactivatedNodes: 0,
    deactivatedDeltaToday: 0,
    unreadAlerts: 0,
    alertDeltaLabel: 'no change',
  };

  sensorInventory: SensorRow[] = [];

  onlineNodes = 0;
  offlineNodes = 0;
  weakNodes = 0;

  selectedMetric: 'moisture' | 'temperature' | 'light' = 'moisture';

  pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  pieChartData: ChartData<'pie', number[], string> = {
    labels: ['Normal', 'Warning', 'Critical'],
    datasets: [
      {
        data: [0, 0, 0],
      },
    ],
  };
  
  private weatherApiKey: string = '0b8120fcdfd87c4be96bb4a644287b3d';

  private map: maplibregl.Map | null = null;
  private liveTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private http: HttpClient,
    private alertService: AlertService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.role =
        sessionStorage.getItem('role') || localStorage.getItem('role');
      this.fullName = sessionStorage.getItem('fullName');
      console.log('User role:', this.role);
      console.log('User full name:', this.fullName);
    }

    this.getWeather();
    this.startLiveDashboard();

    this.alertService.unreadCount$.subscribe((count) => {
      this.summary.unreadAlerts = count;
    });
    this.alertService.getAlerts().subscribe();
  }

  get displayRole(): string {
    if (!this.role) return 'No Role';

    switch (this.role.toLowerCase()) {
      case 'farmer':
        return 'Farmer';
      case 'technician':
        return 'Technician';
      default:
        return this.role;
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => this.initMap(), 0);
  }

  ngOnDestroy(): void {
    this.stopLiveDashboard();

    this.markerMap.forEach((m) => m.remove());
    this.markerMap.clear();

    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  isFarmer(): boolean {
    return this.role === 'farmer';
  }

  isTechnician(): boolean {
    return this.role === 'technician';
  }

  private getMetricCategory(
    sensor: SensorRow,
    metric: 'moisture' | 'temperature' | 'light'
  ): 'Normal' | 'Warning' | 'Critical' {
    if (metric === 'light') {
      const value = sensor.light;

      if (value < 20) return 'Critical';
      if (value < 40) return 'Warning';
      if (value <= 70) return 'Normal';
      if (value < 90) return 'Warning';
      return 'Critical';
    }

    if (metric === 'temperature') {
      const value = sensor.temperature;

      if (value < 60 || value >= 95) return 'Critical';
      if ((value >= 60 && value < 70) || (value > 85 && value < 95)) {
        return 'Warning';
      }
      return 'Normal';
    }

    const value = sensor.moisture;

    if (value < 20 || value >= 80) return 'Critical';
    if ((value >= 20 && value < 30) || (value > 60 && value < 80)) {
      return 'Warning';
    }
    return 'Normal';
  }

  updatePieChart(): void {
    let normal = 0;
    let warning = 0;
    let critical = 0;

    for (const sensor of this.sensorInventory) {
      const category = this.getMetricCategory(sensor, this.selectedMetric);

      if (category === 'Normal') normal++;
      else if (category === 'Warning') warning++;
      else if (category === 'Critical') critical++;
    }

    this.pieChartData = {
      labels: ['Normal', 'Warning', 'Critical'],
      datasets: [
        {
          data: [normal, warning, critical],
        },
      ],
    };
  }

  private fetchDashboardSensors(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const role = sessionStorage.getItem('role');
    const userId = sessionStorage.getItem('userId');

    if (!role || !userId) {
      console.warn('Missing role/userId; skip fetching sensors');
      this.sensorInventory = [];
      this.recomputeSummaryFromSensors();
      this.recomputeTechnicianSummary();
      this.updatePieChart();
      this.lastUpdated = new Date();

      if (this.map) {
        this.addMarkers(this.map);
      }
      return;
    }

    const key = `${role}:${userId}`;
    if (this.baselineKey !== key) {
      this.baselineKey = key;
      this.baselineInitialized = false;
      this.hasFittedOnce = false;
    }

    const url =
      role === 'farmer'
        ? `${this.apiBase}/sensors/latest/customer/${userId}`
        : `${this.apiBase}/sensors/latest/technician/${userId}`;

    this.http
      .get<SensorLatestApiRow[]>(url)
      .pipe(
        catchError((err) => {
          console.error('Error fetching latest sensors:', err);
          return of([] as SensorLatestApiRow[]);
        })
      )
      .subscribe((rows) => {
        this.sensorInventory = (rows ?? []).map((r) => {
          const lat = Number(r.latitude);
          const lng = Number(r.longitude);

          return {
            id: r.node_id,
            name: r.node_name,
            latitude: Number.isFinite(lat) ? lat : 0,
            longitude: Number.isFinite(lng) ? lng : 0,
            battery: Number(r.battery ?? 0),
            lastSeen: r.last_reading_at ? new Date(r.last_reading_at) : null,
            temperature: Number(r.temperature ?? 0),
            moisture: Number(r.moisture ?? 0),
            light: Number(r.light ?? 0),
          };
        });

        if (!this.baselineInitialized) {
          this.baselineDeactivated = this.sensorInventory.filter(
            (s) => this.getSensorStatus(s) === 'deactivate'
          ).length;

          this.baselineActive =
            this.sensorInventory.length - this.baselineDeactivated;

          this.baselineInitialized = true;
        }

        this.recomputeSummaryFromSensors();
        this.recomputeTechnicianSummary();
        this.updatePieChart();
        this.lastUpdated = new Date();

        if (this.map) {
          this.addMarkers(this.map);
          this.fitToSensors();
        }
      });
  }

  getSensorStatus(s: SensorRow): SensorStatus {
    if (!s.lastSeen) {
      return 'deactivate';
    }

    const now = new Date().getTime();
    const lastSeen = new Date(s.lastSeen).getTime();
    const diff = now - lastSeen;

    const oneDay = 24 * 60 * 60 * 1000;
    const twoDays = 2 * 24 * 60 * 60 * 1000;

    if (diff < oneDay) return 'online';
    if (diff < twoDays) return 'weak';
    return 'offline';
  }

  getSensorStatusLabel(s: SensorRow): string {
    switch (this.getSensorStatus(s)) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'weak':
        return 'Weak';
      case 'deactivate':
        return 'Deactivated';
      default:
        return 'Online';
    }
  }

  private recomputeSummaryFromSensors(): void {
    const deactivated = this.sensorInventory.filter(
      (s) => this.getSensorStatus(s) === 'deactivate'
    ).length;

    const active = this.sensorInventory.length - deactivated;

    this.summary.activeNodes = active;
    this.summary.deactivatedNodes = deactivated;
    this.summary.activeDeltaToday = active - this.baselineActive;
    this.summary.deactivatedDeltaToday =
      deactivated - this.baselineDeactivated;
  }

  private recomputeTechnicianSummary(): void {
    this.onlineNodes = this.sensorInventory.filter(
      (s) => this.getSensorStatus(s) === 'online'
    ).length;

    this.offlineNodes = this.sensorInventory.filter(
      (s) => this.getSensorStatus(s) === 'offline'
    ).length;

    this.weakNodes = this.sensorInventory.filter(
      (s) => this.getSensorStatus(s) === 'weak'
    ).length;
  }

  private startLiveDashboard(): void {
    if (this.liveTimer) clearInterval(this.liveTimer);

    this.fetchDashboardSensors();

    this.liveTimer = setInterval(() => {
      this.fetchDashboardSensors();
    }, 500000);
  }

  private stopLiveDashboard(): void {
    if (this.liveTimer) {
      clearInterval(this.liveTimer);
      this.liveTimer = null;
    }
  }

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
            const pop = forecast?.list?.[0]?.pop;
            this.rainChance =
              typeof pop === 'number' ? Math.round(pop * 100) : null;
            this.lastUpdated = new Date();
          });
      });
  }

  getForecast(city: string) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
      city
    )}&appid=${this.weatherApiKey}&units=imperial`;

    return this.http.get<any>(url);
  }

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

  private getMarkerColor(status: string) {
    if (status === 'online') return '#3c8e3f';
    if (status === 'offline') return '#e00e0e';
    if (status === 'weak') return '#e6b800';
    return '#777';
  }

  private createMarker(sensor: SensorRow) {
    const lat = Number(sensor.latitude);
    const lng = Number(sensor.longitude);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      (lat === 0 && lng === 0)
    ) {
      console.warn('Invalid coords:', sensor.id, lat, lng);
      return null;
    }

    const status = this.getSensorStatus(sensor);

    const marker = new maplibregl.Marker({
      color: this.getMarkerColor(status),
    }).setLngLat([lng, lat]);

    marker.setPopup(
      new maplibregl.Popup({ offset: 25 }).setHTML(
        `<b>${sensor.name}</b><br/>ID: ${sensor.id}<br/>Status: ${this.getSensorStatusLabel(
          sensor
        )}`
      )
    );

    return marker;
  }

  addMarkers(map: maplibregl.Map) {
    if (!map) return;

    this.markerMap.forEach((m) => m.remove());
    this.markerMap.clear();

    this.sensorInventory.forEach((sensor) => {
      const marker = this.createMarker(sensor);
      if (!marker) return;

      marker.addTo(map);
      this.markerMap.set(sensor.id, marker);
    });

    console.log('Markers added:', this.markerMap.size);
  }

  private fitToSensors(): void {
    if (!this.map) return;
    if (!this.sensorInventory || this.sensorInventory.length === 0) return;
    if (this.hasFittedOnce) return;

    const bounds = new maplibregl.LngLatBounds();
    let hasAny = false;

    for (const s of this.sensorInventory) {
      const lat = Number(s.latitude);
      const lng = Number(s.longitude);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (lat === 0 && lng === 0) continue;

      bounds.extend([lng, lat]);
      hasAny = true;
    }

    if (!hasAny) return;

    this.map.fitBounds(bounds, {
      padding: 80,
      maxZoom: 18,
      duration: 600,
    });

    this.hasFittedOnce = true;
  }

  initMap(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const container = document.getElementById('sensor-map');
    if (!container) {
      setTimeout(() => this.initMap(), 500);
      return;
    }

    const apiKey =
      'v1.public.eyJqdGkiOiI2MDM1MGM1NS01NTA2LTRiN2UtOTMyYi1lMjY2MGE4YzYxOTAifRCpWzRX3DXl_fDGk-Ot2SIc9KbxXaQ2ocnJ3uNYCPb3yWlrLF_GDLcype-t7GZe7hy09jWdPhk9SGTWh6B4of40o-sbQnRe_TKYUkypJ1B0LGh3NcF54lVHbsYjP7BZbXYLnD4W0hFtr7q5mRVMbYLsDZ9MfrDPVBWyxoWVsrvf4rp9DpxWQ3asaBIWxSsEcKDqRhI-Pqm03-Hmwi99r84QIcoo_wjF6MdupZbUFmiP4rCO8mLf1N1__aTUUeQpoHtwYRZ1lazKawvR09eVKnPrBtL_sQyLGZhxXYQPpDelPx1MqShVDLkcqn_h-9SbJPi3ngVhZqkezJ2R4B69FJk.ZWU0ZWIzMTktMWRhNi00Mzg0LTllMzYtNzlmMDU3MjRmYTkx';
    const region = 'us-east-1';
    const style = 'Standard';
    const colorScheme = 'Light';

    try {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }

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

      setTimeout(() => this.map?.resize(), 0);

      this.map.on('load', () => {
        this.map?.resize();
        this.addMarkers(this.map!);
        this.fitToSensors();
      });

      this.map.on('error', (e: any) => {
        console.error('MAPLIBRE ERROR:', e?.error || e);
      });
    } catch (err) {
      console.error('❌ Failed to initialize map:', err);
    }
  }
}
