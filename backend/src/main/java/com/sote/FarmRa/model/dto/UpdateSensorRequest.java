package com.sote.FarmRa.model.dto;

import java.util.UUID;

public record UpdateSensorRequest(
        String name,
        Double latitude,
        Double longitude,
        UUID customerId
) {}
