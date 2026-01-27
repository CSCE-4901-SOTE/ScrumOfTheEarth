package com.sote.FarmRa.service;

import java.util.List;

import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
import org.springframework.stereotype.Service;

import com.sote.FarmRa.model.Gateway;
import com.sote.FarmRa.model.HardwareStatus;
import com.sote.FarmRa.model.SensorNode;
import com.sote.FarmRa.model.SensorReading;
import com.sote.FarmRa.model.dto.UploadSensorDto;
import com.sote.FarmRa.model.dto.UploadSensorReadingDto;
import com.sote.FarmRa.model.mapper.SensorMapper;
import com.sote.FarmRa.repository.GatewayRepository;
import com.sote.FarmRa.repository.SensorReadingRepository;
import com.sote.FarmRa.repository.SensorRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SensorService {
    private final SensorRepository sensorRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final GatewayRepository gatewayRepository;

    public List<SensorNode> getSensors() {
        return sensorRepository.findAll();
    }

    public void saveSenorNode(UploadSensorDto sensorNodeDto) throws NotFoundException {
        // Try to find the associated gateway
        Gateway gateway = gatewayRepository.findById(sensorNodeDto.getGatewayId()).orElseThrow(NotFoundException::new);
        // Map the sensor node and save it in the repository
        SensorNode sensorNode = SensorMapper.mapSensorNode(sensorNodeDto);
        sensorNode.setGateway(gateway);
        sensorNode.setSensorStatus(HardwareStatus.ONLINE);
        sensorRepository.save(sensorNode);
    }

    public void saveSensorData(UploadSensorReadingDto reading) throws NotFoundException {
        // Try to find the associated sensor node
        SensorNode sensorNode = sensorRepository.findById(reading.getNodeId()).orElseThrow(NotFoundException::new);
        // Map into the sensor reading and set the associated node :)
        SensorReading sensorReading = SensorMapper.mapSensorReading(reading);
        sensorReading.setNode(sensorNode);
        sensorReadingRepository.save(sensorReading);
    }
}
