package com.sote.FarmRa.model.dto;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UploadSensorReadingDto {
    private String nodeId;
    private Instant readingTimestamp;
    private float soilMoisture;
    private float soilTemperature;
    private boolean light;
}
