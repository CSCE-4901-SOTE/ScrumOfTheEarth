import { HardwareStatus } from "./hardware-status.model";

export interface SensorInventory {
    id: string;
    name: string;
    lastSeen: Date | null;
    battery: number | null;
    status: HardwareStatus;
    latitude: number;
    longitude: number;
}