import { EnvironmentInjector, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Sensor } from '../models/sensor.model';
import { HardwareStatus } from '../models/hardware-status.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SensorService {
  private readonly baseUrl = environment.backendUrl + "/sensors";

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
  computeStatusFromData(sensor: Sensor): HardwareStatus {
    // null check
    const rssi = sensor.rssi;
    if(rssi == null) return HardwareStatus.UNKNOWN;

    const lvl = this.convertDbmToLevel(rssi);
    if (lvl <= 1) return HardwareStatus.OFFLINE;
    if (lvl <= 2) return HardwareStatus.WEAK;
    return HardwareStatus.ONLINE;
  }

  // GET sensors from backend
  getSensors(): Observable<Sensor[]> {
    return this.http.get<Sensor[]>(this.baseUrl);
  }

  activate(sensor: Sensor): void {
    if (sensor.status !== HardwareStatus.DEACTIVATED) return;

    sensor.status = this.computeStatusFromData(sensor);
  }

  deactivate(sensor: Sensor): void {
    if (sensor.status === HardwareStatus.DEACTIVATED) return;

    sensor.status = HardwareStatus.DEACTIVATED;
    sensor.rssi = -120;
    sensor.packetLoss = 0;
    sensor.battery = 0;
  }

  getSensorsByCustomer(customerId: string) {
    return this.http
    .get<Sensor[]>(`${this.baseUrl}/customer/${customerId}`);
  }

  getSensorsByTechnician(technicianId: string) {
    return this.http
    .get<Sensor[]>(`${this.baseUrl}/technician/${technicianId}`);
  }

  deactivateSensor(id: string) {
    return this.http.put<Sensor>(`${this.baseUrl}/${id}/deactivate`, {});
  }

  activateSensor(id: string) {
    return this.http.put<Sensor>(`${this.baseUrl}/${id}/activate`, {});
  }

}
