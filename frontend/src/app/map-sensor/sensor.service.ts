import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export type SensorStatus = 'online' | 'weak' | 'offline' | 'deactivate';

export type SavedState = {
  status: SensorStatus;
  rssi: number;
  packetLoss: number;
  battery: number;
  temperature: number;
  moisture: number;
  light: boolean;
};

export type Sensor = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: SensorStatus;
  serialNumber?: string | null;

  rssi: number;
  packetLoss: number;
  battery: number;
  temperature: number;
  moisture: number;
  light: boolean;

  technicianName: string;
  customerName: string;

  savedState: SavedState | null;
};

type ApiUser = { userId?: string; fullName?: string };

type ApiSensor = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: SensorStatus;
  serialNumber?: string | null;

  rssi?: number | null;
  packetLoss?: number | null;
  battery?: number | null;
  temperature?: number | null;
  moisture?: number | null;
  light?: boolean | null;

  customer?: ApiUser | null;
  technician?: ApiUser | null;

  savedStatus?: SensorStatus | null;
  savedRssi?: number | null;
  savedPacketLoss?: number | null;
  savedBattery?: number | null;
  savedTemperature?: number | null;
  savedMoisture?: number | null;
  savedLight?: boolean | null;
};

export type LatestRow = {
  node_id: string;
  node_name: string;
  latitude: number | null;
  longitude: number | null;
  node_status: string | null;
  temperature: number | null;
  moisture: number | null;
  light: boolean | null;
  last_reading_at: string | null;
  technician_name?: string | null;
  customer_name?: string | null;
};

export function normalizeStatus(raw: string | null | undefined): SensorStatus {
  const s = (raw ?? '').toString().trim().toLowerCase();
  if (s === 'online' || s === 'active' || s === 'enabled') return 'online';
  if (s === 'offline' || s === 'inactive') return 'offline';
  if (s === 'weak' || s === 'low' || s === 'poor') return 'weak';
  if (s === 'deactivate' || s === 'deactivated' || s === 'disabled') return 'deactivate';
  return 'online';
}

@Injectable({ providedIn: 'root' })
export class SensorService {
  private readonly baseUrl = 'http://localhost:8080/api/sensors';

  constructor(private http: HttpClient) {}

  addSensor(payload: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    customerId: string;
    technicianId: string | null;
    serialNumber: string;
  }) {
    return this.http.post<ApiSensor>(this.baseUrl, payload)
      .pipe(map(this.mapApiToSensor));
  }

  convertDbmToLevel(dBm: number): number {
    if (dBm >= -55) return 5;
    if (dBm >= -65) return 4;
    if (dBm >= -75) return 3;
    if (dBm >= -85) return 2;
    return 1;
  }

  computeStatusFromData(sensor: Sensor): 'online' | 'offline' | 'weak' {
    const lvl = this.convertDbmToLevel(sensor.rssi);
    if (lvl <= 1) return 'offline';
    if (lvl <= 2) return 'weak';
    return 'online';
  }

  private mapApiToSensor = (s: ApiSensor): Sensor => {
    const savedState: SavedState | null =
      s.savedStatus
        ? {
            status: s.savedStatus,
            rssi: s.savedRssi ?? -120,
            packetLoss: s.savedPacketLoss ?? 0,
            battery: s.savedBattery ?? 0,
            temperature: s.savedTemperature ?? 0,
            moisture: s.savedMoisture ?? 0,
            light: s.savedLight ?? false,
          }
        : null;

    return {
      id: s.id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      status: s.status,
      serialNumber: s.serialNumber ?? '',

      rssi: s.rssi ?? -120,
      packetLoss: s.packetLoss ?? 0,
      battery: s.battery ?? 0,
      temperature: s.temperature ?? 0,
      moisture: s.moisture ?? 0,
      light: s.light ?? false,

      technicianName: s.technician?.fullName ?? '',
      customerName: s.customer?.fullName ?? '',

      savedState,
    };
  };

  getSensors(): Observable<Sensor[]> {
    return this.http.get<ApiSensor[]>(this.baseUrl).pipe(map(list => list.map(this.mapApiToSensor)));
  }

  getSensorsByCustomer(customerId: string) {
    return this.http.get<ApiSensor[]>(`${this.baseUrl}/customer/${customerId}`)
      .pipe(map(list => (list ?? []).map(this.mapApiToSensor)));
  }

  getSensorsByTechnician(technicianId: string) {
    return this.http.get<ApiSensor[]>(`${this.baseUrl}/technician/${technicianId}`)
      .pipe(map(list => (list ?? []).map(this.mapApiToSensor)));
  }

  deactivateSensor(id: string) {
    return this.http.put<ApiSensor>(`${this.baseUrl}/${id}/deactivate`, {})
      .pipe(map(this.mapApiToSensor));
  }

  activateSensor(id: string) {
    return this.http.put<ApiSensor>(`${this.baseUrl}/${id}/activate`, {})
      .pipe(map(this.mapApiToSensor));
  }

  getLatestSensorsByRole(role: 'farmer' | 'technician', userId: string) {
    const url =
      role === 'farmer'
        ? `http://localhost:8080/api/sensors/latest/customer/${userId}`
        : `http://localhost:8080/api/sensors/latest/technician/${userId}`;

    return this.http.get<LatestRow[]>(url).pipe(
      map(list => (list ?? []).map(r => ({
        id: r.node_id,
        name: r.node_name,
        latitude: Number(r.latitude ?? 0),
        longitude: Number(r.longitude ?? 0),
        status: normalizeStatus(r.node_status),

        rssi: -70,
        packetLoss: 0,
        battery: 100,
        temperature: Number(r.temperature ?? 0),
        moisture: Number(r.moisture ?? 0),
        light: !!r.light,

        technicianName: r.technician_name ?? '',
        customerName: r.customer_name ?? '',
        savedState: null,
      } as Sensor)))
    );
  }
}
