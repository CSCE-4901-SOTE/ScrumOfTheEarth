package com.sote.FarmRa.model.dto;

import java.time.Instant;

import com.sote.FarmRa.model.HardwareStatus;

public record SensorDTO(
        String id,
        String name,
        float latitude,
        float longitude,
        HardwareStatus status,
        Integer battery,
        Instant lastSeen
) {}
