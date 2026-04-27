package com.sote.FarmRa.model.dto;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSensorResponse {
    String id;
    String name;
    Double latitude;
    Double longitude;
    String status;
    Instant lastSeen;
    String serialNumber;
    String customerId;
    Integer battery;
    Integer temperature;
    Integer moisture;
    Integer light;
    String technicianName;
    String customerName;
}
