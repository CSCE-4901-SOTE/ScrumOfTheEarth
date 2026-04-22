import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export type SensorStatus = 'online' | 'weak' | 'offline' | 'deactivated';

export type Sensor = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: SensorStatus;
  lastSeen?: string | Date | null;

  serialNumber?: string | null;
  customerId?: string | null;

  battery: number;
  temperature: number;
  moisture: number;
  light: number;

  technicianName: string;
  customerName: string;
};

type ApiUser = {
  userId?: string;
  fullName?: string;
};

type ApiSensor = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  serialNumber?: string | null;
  customerId?: string | null;

  battery?: number | null;
  temperature?: number | null;
  moisture?: number | null;
  light?: number | null;

  customer?: ApiUser | null;
  technician?: ApiUser | null;
};

export type LatestRow = {
  node_id: string;
  node_name: string;
  latitude: number | null;
  longitude: number | null;
  node_status: string | null;
  temperature: number | null;
  moisture: number | null;
  light: number | null;
  battery?: number | null;
  last_reading_at: string | null;
  technician_name?: string | null;
  customer_name?: string | null;
  customer_id?: string | null;
  serial_number?: string | null;
};

export function normalizeStatus(raw: string | null | undefined): SensorStatus {
  const s = (raw ?? '').toString().trim().toLowerCase();

  if (s === 'online' || s === 'active' || s === 'enabled') return 'online';
  if (s === 'offline' || s === 'inactive') return 'offline';
  if (s === 'weak' || s === 'low' || s === 'poor') return 'weak';

  return 'offline';
}

@Injectable({
  providedIn: 'root'
})
export class SensorService {
  private readonly baseUrl = environment.backendUrl + "/sensors";

  constructor(private http: HttpClient) {}

  private mapApiToSensor = (s: ApiSensor): Sensor => {
    return {
      id: s.id,
      name: s.name,
      latitude: Number(s.latitude ?? 0),
      longitude: Number(s.longitude ?? 0),
      status: normalizeStatus(s.status),

      serialNumber: s.serialNumber ?? '',
      customerId: s.customerId ?? s.customer?.userId ?? '',

      battery: Number(s.battery ?? 0),
      temperature: Number(s.temperature ?? 0),
      moisture: Number(s.moisture ?? 0),
      light: Number(s.light ?? 0),

      technicianName: s.technician?.fullName ?? '',
      customerName: s.customer?.fullName ?? '',
    };
  };

  addSensor(payload: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    customerId: string;
    technicianId: string | null;
    serialNumber: string;
  }): Observable<Sensor> {
    return this.http
      .post<ApiSensor>(this.baseUrl, payload)
      .pipe(map(this.mapApiToSensor));
  }

  updateSensor(
    sensorId: string,
    payload: {
      name: string;
      latitude: number;
      longitude: number;
      customerId: string;
    }
  ): Observable<Sensor> {
    return this.http
      .put<ApiSensor>(`${this.baseUrl}/${sensorId}`, payload)
      .pipe(map(this.mapApiToSensor));
  }

  getSensors(): Observable<Sensor[]> {
    return this.http
      .get<ApiSensor[]>(this.baseUrl)
      .pipe(map(list => (list ?? []).map(this.mapApiToSensor)));
  }

  getSensorById(sensorId: string): Observable<Sensor> {
    return this.http
      .get<ApiSensor>(`${this.baseUrl}/${sensorId}`)
      .pipe(map(this.mapApiToSensor));
  }

  getSensorsByCustomer(customerId: string): Observable<Sensor[]> {
    return this.http
      .get<ApiSensor[]>(`${this.baseUrl}/customer/${customerId}`)
      .pipe(map(list => (list ?? []).map(this.mapApiToSensor)));
  }

  getSensorsByTechnician(technicianId: string): Observable<Sensor[]> {
    return this.http
      .get<ApiSensor[]>(`${this.baseUrl}/technician/${technicianId}`)
      .pipe(map(list => (list ?? []).map(this.mapApiToSensor)));
  }

  deleteSensor(sensorId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${sensorId}`);
  }

  getLatestSensorsByRole(
    role: 'farmer' | 'technician',
    userId: string
  ): Observable<Sensor[]> {
    const url =
      role === 'farmer'
        ? `${this.baseUrl}/latest/customer/${userId}`
        : `${this.baseUrl}/latest/technician/${userId}`;

    return this.http.get<LatestRow[]>(url).pipe(
      map(list =>
        (list ?? [])
          .filter(r => r.latitude != null && r.longitude != null)
          .map(
            r =>
              ({
                id: r.node_id,
                name: r.node_name,
                latitude: Number(r.latitude),
                longitude: Number(r.longitude),
                status: normalizeStatus(r.node_status),
                lastSeen: r.last_reading_at ? new Date(r.last_reading_at) : null,

                serialNumber: r.serial_number ?? '',
                customerId: r.customer_id ?? '',

                battery: Number(r.battery ?? 0),
                temperature: Number(r.temperature ?? 0),
                moisture: Number(r.moisture ?? 0),
                light: Number(r.light ?? 0),

                technicianName: r.technician_name ?? '',
                customerName: r.customer_name ?? '',
              }) as Sensor
          )
      )
    );
  }
}
