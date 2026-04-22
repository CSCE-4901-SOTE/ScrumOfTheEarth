package com.sote.FarmRa.model.dto;

import com.sote.FarmRa.model.AlertType;

import java.time.Instant;
import java.util.UUID;

public record AlertDTO(
    UUID id,
    String sensorId,
    String sensorName,
    AlertType alertType,
    String message,
    Instant createdAt,
    boolean acknowledged
) {}
