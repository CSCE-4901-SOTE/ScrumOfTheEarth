package com.sote.FarmRa.model.dto;

import java.time.Instant;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TechnicianSensorResponseDTO {
    String id;
    String name;
    String serialNumber;
    double latitude;
    double longitude;
    String status;
    Integer battery;
    Integer temperature;
    Integer moisture;
    Integer light;
    Instant lastSeen;
    UUID customerId;
    String customerName;
}
