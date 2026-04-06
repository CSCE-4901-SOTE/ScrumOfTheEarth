package com.sote.FarmRa.model.dto;

import java.util.UUID;

public record CreateSensorRequest(
        String id,
        String name,
        double latitude,
        double longitude,
        UUID customerId,
        UUID technicianId
) {}
