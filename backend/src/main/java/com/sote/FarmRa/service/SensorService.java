package com.sote.FarmRa.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.sote.FarmRa.model.SensorNode;
import com.sote.FarmRa.repository.SensorRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SensorService {
    private final SensorRepository sensorRepository;

    public List<SensorNode> getSensors() {
        return sensorRepository.findAll();
    }

    public void saveSensorData(String data) throws Exception {
        log.info(data);
    }
}
