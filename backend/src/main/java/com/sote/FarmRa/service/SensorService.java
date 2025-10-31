package com.sote.FarmRa.service;

import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SensorService {

    public void saveSensorData(String data) throws Exception {
        log.info(data);
    }
}
