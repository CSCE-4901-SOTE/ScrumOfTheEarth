import { HardwareStatus } from "../models/hardware-status.model"

export function mapHardwareStatusToClass(status: HardwareStatus) {
    var statusString = status.toString();
    if(statusString === "DEACTIVATED") {
        statusString = 'DEACTIVATE';
    } 
        
    return statusString.toLowerCase();
}