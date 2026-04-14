package com.sote.FarmRa.model.dto;

import java.util.UUID;

public record CreateSensorRequest(
        String id,
        String name,
        String serialNumber,
        double latitude,
        double longitude,
        UUID customerId,
        UUID technicianId
) {}
