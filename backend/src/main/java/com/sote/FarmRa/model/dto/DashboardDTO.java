package com.sote.FarmRa.model.dto;

public record DashboardDTO(
        int activeNodes,
        int activeDeltaToday,
        int deactivatedNodes,
        int deactivatedDeltaToday
) {}
