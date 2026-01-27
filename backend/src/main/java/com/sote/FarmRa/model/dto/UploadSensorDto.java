package com.sote.FarmRa.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UploadSensorDto {
    private long gatewayId;
    private float longitude;
    private float latitude;
    private String serialNumber;
}
