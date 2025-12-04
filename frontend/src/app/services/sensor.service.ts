import { httpResource, HttpResourceRef } from "@angular/common/http";
import { Injectable, ResourceStatus, Signal, signal, WritableSignal } from "@angular/core";
import { Sensor } from "../models/sensor.model";
import { PageResultsDTO } from "../models/page-results.dto";

@Injectable({providedIn: 'root'})
export class SensorService {
    readonly baseUrl = 'http://localhost:8080/api/sensors';

    technicianId: WritableSignal<number> = signal(0);

    private technicianSearchResource: HttpResourceRef<PageResultsDTO<Sensor> | undefined> = httpResource<PageResultsDTO<Sensor>>(() => {
        const techId: number = this.technicianId();
        return `${this.baseUrl}/`
    });

    public readonly techniciansSensors: Signal<PageResultsDTO<Sensor> | null | undefined> = 
        this.technicianSearchResource?.value.asReadonly();
    
    public sensorSearchStatus: Signal<ResourceStatus> = this.technicianSearchResource?.status;
}