package com.sote.FarmRa.dto;

public record DashboardDTO(
        int activeNodes,
        int activeDeltaToday,
        int deactivatedNodes,
        int deactivatedDeltaToday
) {}
