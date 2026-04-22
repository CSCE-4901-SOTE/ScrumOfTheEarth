package com.sote.FarmRa.service;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.sote.FarmRa.entity.Sensor;
import com.sote.FarmRa.entity.User;
import com.sote.FarmRa.repository.SensorRepository;
import com.sote.FarmRa.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class SensorService {
    private final SensorRepository sensorRepository;
    private final UserRepository userRepository;

    public List<Sensor> getSensors() {
        return sensorRepository.findAll();
    }

    public List<Sensor> getByCustomer(UUID customerId) {
        return sensorRepository.findByCustomer_UserId(customerId);
    }

    public List<Sensor> getByTechnician(UUID technicianId) {
        return sensorRepository.findByTechnician_UserId(technicianId);
    }

    public Sensor getById(String id) {
        return sensorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sensor not found: " + id));
    }

    public Sensor create(Sensor sensor) {
        if (sensor.getId() == null || sensor.getId().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sensor id is required");
        }
        if (sensorRepository.existsById(sensor.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sensor id already exists: " + sensor.getId());
        }
        if (sensor.getName() == null || sensor.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name is required");
        }
        if (sensor.getStatus() == null || sensor.getStatus().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status is required");
        }

        return sensorRepository.save(sensor);
    }

    public Sensor update(String id, Sensor patch) {
        Sensor s = getById(id);
        if (patch.getName() != null) s.setName(patch.getName());
        if (patch.getStatus() != null) s.setStatus(patch.getStatus());
        s.setLatitude(patch.getLatitude());
        s.setLongitude(patch.getLongitude());
        if (patch.getBattery() != null) s.setBattery(patch.getBattery());
        if (patch.getTemperature() != null) s.setTemperature(patch.getTemperature());
        if (patch.getMoisture() != null) s.setMoisture(patch.getMoisture());
        if (patch.getLight() != null) s.setLight(patch.getLight());
        return sensorRepository.save(s);
    }

    public Sensor assignCustomer(String sensorId, UUID customerId) {
        Sensor s = getById(sensorId);
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Customer not found: " + customerId));
        s.setCustomer(customer);
        return sensorRepository.save(s);
    }

    public Sensor clearCustomer(String sensorId) {
        Sensor s = getById(sensorId);
        s.setCustomer(null);
        return sensorRepository.save(s);
    }

    public Sensor assignTechnician(String sensorId, UUID technicianId) {
        Sensor s = getById(sensorId);
        User tech = userRepository.findById(technicianId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Technician not found: " + technicianId));
        s.setTechnician(tech);
        return sensorRepository.save(s);
    }

    public Sensor clearTechnician(String sensorId) {
        Sensor s = getById(sensorId);
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
