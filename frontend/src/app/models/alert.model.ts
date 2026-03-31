export type AlertType = 'LOW_MOISTURE' | 'HIGH_TEMPERATURE' | 'LOW_BATTERY' | 'LOW_SIGNAL';

export interface AlertItem {
    id: string;
    sensorId: string;
    sensorName: string;
    alertType: AlertType;
    message: string;
    createdAt: string;
    acknowledged: boolean;
}
