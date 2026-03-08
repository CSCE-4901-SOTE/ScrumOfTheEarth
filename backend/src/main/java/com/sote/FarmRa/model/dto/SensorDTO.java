package com.sote.FarmRa.model.dto;

import java.time.Instant;

public record SensorDTO(
        String id,
        String name,
        double latitude,
        double longitude,
        String status,
        Integer battery,
        Instant lastSeen
) {}
