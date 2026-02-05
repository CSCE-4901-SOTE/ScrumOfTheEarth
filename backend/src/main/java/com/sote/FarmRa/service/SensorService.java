package com.sote.FarmRa.service;

import java.util.List;
import java.util.UUID;

import org.springframework.data.crossstore.ChangeSetPersister.NotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.sote.FarmRa.model.Gateway;
import com.sote.FarmRa.model.HardwareStatus;
import com.sote.FarmRa.model.SensorNode;
import com.sote.FarmRa.model.SensorReading;
import com.sote.FarmRa.model.User;
import com.sote.FarmRa.model.dto.UploadSensorDto;
import com.sote.FarmRa.model.dto.UploadSensorReadingDto;
import com.sote.FarmRa.model.mapper.SensorMapper;
import com.sote.FarmRa.repository.GatewayRepository;
import com.sote.FarmRa.repository.SensorReadingRepository;
import com.sote.FarmRa.repository.SensorRepository;
import com.sote.FarmRa.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SensorService {
    private final SensorRepository sensorRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final GatewayRepository gatewayRepository;
    private final UserRepository userRepository;

    public List<SensorNode> getSensors() {
        return sensorRepository.findAll();
    }

    public void saveSenorNode(UploadSensorDto sensorNodeDto) throws NotFoundException {
        Gateway gateway = gatewayRepository.findById(sensorNodeDto.getGatewayId()).orElseThrow(NotFoundException::new);
        SensorNode sensorNode = SensorMapper.mapSensorNode(sensorNodeDto);
        sensorNode.setGateway(gateway);
        sensorNode.setSensorStatus(HardwareStatus.ONLINE);
        sensorRepository.save(sensorNode);
    }

    public void saveSensorData(UploadSensorReadingDto reading) throws NotFoundException {
        SensorNode sensorNode = sensorRepository.findById(reading.getNodeId()).orElseThrow(NotFoundException::new);
        SensorReading sensorReading = SensorMapper.mapSensorReading(reading);
        sensorReading.setNode(sensorNode);
        sensorReadingRepository.save(sensorReading);
    }

    public SensorNode getById(String id) {
        return sensorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sensor not found: " + id));
    }

    public SensorNode create(SensorNode sensor) {
        if (sensor.getId() == null || sensor.getId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sensor id is required");
        }
        if (sensorRepository.existsById(sensor.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sensor already exists: " + sensor.getId());
        }
        return sensorRepository.save(sensor);
    }

    public SensorNode update(String id, SensorNode patch) {
        SensorNode s = getById(id);
        if (patch.getName() != null) s.setName(patch.getName());
        if (patch.getSensorStatus() != null) s.setSensorStatus(patch.getSensorStatus());
        s.setLatitude(patch.getLatitude());
        s.setLongitude(patch.getLongitude());
        if (patch.getRssi() != null) s.setRssi(patch.getRssi());
        if (patch.getPacketLoss() != null) s.setPacketLoss(patch.getPacketLoss());
        if (patch.getBattery() != null) s.setBattery(patch.getBattery());
        if (patch.getTemperature() != null) s.setTemperature(patch.getTemperature());
        if (patch.getMoisture() != null) s.setMoisture(patch.getMoisture());
        if (patch.getLight() != null) s.setLight(patch.getLight());
        return sensorRepository.save(s);
    }

    public SensorNode assignCustomer(String sensorId, UUID customerId) {
        SensorNode s = getById(sensorId);
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer not found: " + customerId));
        s.setCustomer(customer);
        return sensorRepository.save(s);
    }

    public SensorNode clearCustomer(String sensorId) {
        SensorNode s = getById(sensorId);
        s.setCustomer(null);
        return sensorRepository.save(s);
    }

    public SensorNode assignTechnician(String sensorId, UUID technicianId) {
        SensorNode s = getById(sensorId);
        User tech = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Technician not found: " + technicianId));
        s.setTechnician(tech);
        return sensorRepository.save(s);
    }

    public SensorNode clearTechnician(String sensorId) {
        SensorNode s = getById(sensorId);
        s.setTechnician(null);
        return sensorRepository.save(s);
    }

    public void delete(String id) {
        if (!sensorRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Sensor not found: " + id);
        }
        sensorRepository.deleteById(id);
    }
}
