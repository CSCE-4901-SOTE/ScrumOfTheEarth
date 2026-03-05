import { Sensor } from "./sensor.model";

export interface SensorReading {
    id: String;
    node: Sensor;
    createdAt: Date;
    moisture: number;
    temperature: number;
    light: boolean;
}