import { Gateway } from "./gateway.model";

export interface Sensor {
    id: number;
    gateway: Gateway;
    sensorStatus: string;
    longitude: number;
    latitude: number;
    serialNumber: string;
    batteryLevel: number;
}