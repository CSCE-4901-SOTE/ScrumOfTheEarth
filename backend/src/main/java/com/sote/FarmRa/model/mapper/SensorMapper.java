package com.sote.FarmRa.model.mapper;

import com.sote.FarmRa.model.SensorNode;
import com.sote.FarmRa.model.SensorReading;
import com.sote.FarmRa.model.dto.UploadSensorDto;
import com.sote.FarmRa.model.dto.UploadSensorReadingDto;

public class SensorMapper {
    public static SensorNode mapSensorNode(UploadSensorDto uploadSensor) {
        return SensorNode.builder()
            .latitude(uploadSensor.getLatitude())
            .longitude(uploadSensor.getLongitude())
            .serialNumber(uploadSensor.getSerialNumber())
            .build();
    }

    public static SensorReading mapSensorReading(UploadSensorReadingDto uploadSensorReading) {
        return SensorReading.builder()
            .createdAt(uploadSensorReading.getReadingTimestamp())
            .moisture(uploadSensorReading.getSoilMoisture())
            .temperature(uploadSensorReading.getSoilTemperature())
            .light(uploadSensorReading.isLight())
            .build();
    }
}
