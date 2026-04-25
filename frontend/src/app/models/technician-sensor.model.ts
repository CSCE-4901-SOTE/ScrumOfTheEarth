export interface TechnicianSensor {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    status: string;
    serialNumber: string | null;
    customerId: string | null;

    battery: number | null;
    temperature: number | null;
    moisture: number | null;
    light: number | null;

    customerName: string | null;
}