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
  light: number;
};

export type Sensor = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: SensorStatus;

  rssi: number;
  packetLoss: number;
  battery: number;
  temperature: number;
  moisture: number;
  light: number;

  technicianName: string;
  customerName: string;

  savedState: SavedState | null;
};
type ApiUser = {
  userId?: string;
  name?: string;
};

type ApiSensor = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: SensorStatus;

  rssi?: number | null;
  packetLoss?: number | null;
  battery?: number | null;
  temperature?: number | null;
  moisture?: number | null;
  light?: number | null;

  customer?: ApiUser | null;
  technician?: ApiUser | null;

  // saved_* fields theo DB/entity
  savedStatus?: SensorStatus | null;
  savedRssi?: number | null;
  savedPacketLoss?: number | null;
  savedBattery?: number | null;
  savedTemperature?: number | null;
  savedMoisture?: number | null;
  savedLight?: number | null;
};

@Injectable({ providedIn: 'root' })
export class SensorService {
  private readonly baseUrl = '/api/sensors';

  constructor(private http: HttpClient) {}

  /* Converts RSSI (dBm) into a 1–5 signal strength level */
  convertDbmToLevel(dBm: number): number {
    if (dBm >= -55) return 5;
    if (dBm >= -65) return 4;
    if (dBm >= -75) return 3;
    if (dBm >= -85) return 2;
    return 1;
  }

  // Compute online/weak/offline from stored readings
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
            light: s.savedLight ?? 0
          }
        : null;

    return {
      id: s.id,
      name: s.name,
      latitude: s.latitude,
      longitude: s.longitude,
      status: s.status,

      rssi: s.rssi ?? -120,
      packetLoss: s.packetLoss ?? 0,
      battery: s.battery ?? 0,
      temperature: s.temperature ?? 0,
      moisture: s.moisture ?? 0,
      light: s.light ?? 0,

      technicianName: s.technician?.name ?? '',
      customerName: s.customer?.name ?? '',

      savedState
    };
  };

  // GET sensors from backend
  getSensors(): Observable<Sensor[]> {
    return this.http.get<ApiSensor[]>(this.baseUrl).pipe(
      map(list => list.map(this.mapApiToSensor))
    );
  }

  activate(sensor: Sensor): void {
    if (sensor.status !== 'deactivate') return;

    const saved = sensor.savedState;
    if (saved) {
      sensor.rssi = saved.rssi;
      sensor.packetLoss = saved.packetLoss;
      sensor.battery = saved.battery;
      sensor.temperature = saved.temperature;
      sensor.moisture = saved.moisture;
      sensor.light = saved.light;
    }

    sensor.status = this.computeStatusFromData(sensor);
  }

  deactivate(sensor: Sensor): void {
    if (sensor.status === 'deactivate') return;

    sensor.savedState = {
      status: sensor.status,
      rssi: sensor.rssi,
      packetLoss: sensor.packetLoss,
      battery: sensor.battery,
      temperature: sensor.temperature,
      moisture: sensor.moisture,
      light: sensor.light
    };

    sensor.status = 'deactivate';
    sensor.rssi = -120;
    sensor.packetLoss = 0;
    sensor.battery = 0;
  }

  getSensorsByCustomer(customerId: string) {
    return this.http.get<Sensor[]>(`http://localhost:8080/api/sensors/customer/${customerId}`);
  }

  getSensorsByTechnician(technicianId: string) {
    return this.http.get<Sensor[]>(`http://localhost:8080/api/sensors/technician/${technicianId}`);
  }

  deactivateSensor(id: string) {
    return this.http.put<ApiSensor>(`${this.baseUrl}/${id}/deactivate`, {}).pipe(
      map(this.mapApiToSensor));
  }

  activateSensor(id: string) {
    return this.http.put<ApiSensor>(`${this.baseUrl}/${id}/activate`, {}).pipe(
      map(this.mapApiToSensor));
  }

}
