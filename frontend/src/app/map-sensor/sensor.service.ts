import { Injectable } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';

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
  constructor(private supabase: SupabaseService) {}

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

  // GET sensors from Supabase
  async getSensors(): Promise<Sensor[]> {
    try {
      const { data, error } = await this.supabase.getSensors();
      if (error) throw error;
      const list = (data ?? []) as any[];
      return list.map(this.mapApiToSensor);
    } catch (err) {
      console.error('Supabase not available during SSR:', err);
      return []; // Return empty array during SSR
    }
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

  async getSensorsByCustomer(customerId: string) {
    try {
      const { data, error } = await this.supabase.client.from('sensor_node').select('*').eq('customer_id', customerId);
      if (error) throw error;
      return (data ?? []).map(this.mapApiToSensor);
    } catch (err) {
      console.error('Supabase not available during SSR:', err);
      return [];
    }
  }

  async getSensorsByTechnician(technicianId: string) {
    try {
      const { data, error } = await this.supabase.client.from('sensor_node').select('*').eq('technician_id', technicianId);
      if (error) throw error;
      return (data ?? []).map(this.mapApiToSensor);
    } catch (err) {
      console.error('Supabase not available during SSR:', err);
      return [];
    }
  }

  async deactivateSensor(id: string) {
    try {
      const { data, error } = await this.supabase.client.from('sensor_node').update({ status: 'deactivate' }).eq('id', id).select().single();
      if (error) throw error;
      return this.mapApiToSensor(data as ApiSensor);
    } catch (err) {
      console.error('Supabase not available during SSR:', err);
      throw err;
    }
  }

  async activateSensor(id: string) {
    try {
      const { data, error } = await this.supabase.client.from('sensor_node').update({ status: 'online' }).eq('id', id).select().single();
      if (error) throw error;
      return this.mapApiToSensor(data as ApiSensor);
    } catch (err) {
      console.error('Supabase not available during SSR:', err);
      throw err;
    }
  }

}
