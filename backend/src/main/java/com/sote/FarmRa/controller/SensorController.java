package com.sote.FarmRa.controller;

import java.util.List;

import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import com.sote.FarmRa.model.SensorNode;
import com.sote.FarmRa.model.dto.UploadSensorDto;
import com.sote.FarmRa.model.dto.UploadSensorReadingDto;
import com.sote.FarmRa.service.SensorService;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequestMapping(value = "/api/sensor")
@AllArgsConstructor
@Slf4j
public class SensorController {
    private final SensorService sensorService;

    @GetMapping
    public Page<SensorNode> getSensors() {
        List<SensorNode> sensors = sensorService.getSensors();
        return new PageImpl<>(sensors);
    }

    @PostMapping
    public String uploadSensor(@RequestBody UploadSensorDto sensorDto) {
        try {
            sensorService.saveSenorNode(sensorDto);
        } catch (NotFoundException e) {
            log.error(e.getMessage(), e);
        }
        return "ok";
    }

    @PostMapping("/data")
    public String postSensorData(@RequestBody UploadSensorReadingDto readingDto) {
        try {
            sensorService.saveSensorData(readingDto);
        } catch(Exception e) {
            log.error(e.getMessage(), e);
        }
        return "ok";
    }
}
