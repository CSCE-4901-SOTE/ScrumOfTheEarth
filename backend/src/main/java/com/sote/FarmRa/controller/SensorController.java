package com.sote.FarmRa.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import com.sote.FarmRa.service.SensorService;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Controller
@RequestMapping(value = "/api/sensor")
@AllArgsConstructor
@Slf4j
public class SensorController {
    private final SensorService sensorService;

    @PostMapping
    public void postSensorData(@RequestBody String content) {
        log.info("Received the message");
        try {
            sensorService.saveSensorData(content);
        } catch(Exception e) {
            log.info(e.getMessage());
        }
    }
}
