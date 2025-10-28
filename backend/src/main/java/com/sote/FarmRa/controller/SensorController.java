package com.sote.FarmRa.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import com.sote.FarmRa.service.SensorService;

import lombok.AllArgsConstructor;

@Controller
@RequestMapping(value = "/api/sensor")
@AllArgsConstructor
public class SensorController {
    private final SensorService sensorService;

    @PostMapping
    public void postSensorData(@RequestBody String content) {
    }
}
