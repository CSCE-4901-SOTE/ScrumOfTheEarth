import { Gateway } from "./gateway.model";
import { HardwareStatus } from "./hardware-status.model";
import { SensorReading } from "./sensor-reading.model";
import { User } from "./user.model";

export interface Sensor {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    status: HardwareStatus;
    gateway: Gateway;
    sensorReadings: SensorReading[];

    rssi: number | null;
    packetLoss: number | null;
    battery: number | null;

    customer: User | null;
    technician: User | null;

    // saved_* fields theo DB/entity
    savedStatus: HardwareStatus | null;
    savedRssi: number | null;
    savedPacketLoss: number | null;
    savedBattery: number | null;
}