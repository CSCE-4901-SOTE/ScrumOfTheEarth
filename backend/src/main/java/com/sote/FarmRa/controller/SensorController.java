package com.sote.FarmRa.controller;

import com.sote.FarmRa.entity.Sensor;
import com.sote.FarmRa.model.User;
import com.sote.FarmRa.model.dto.CreateSensorRequest;
import com.sote.FarmRa.repository.SensorRepository;
import com.sote.FarmRa.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sensors")
public class SensorController {

    private final SensorRepository sensorRepository;
    private final UserRepository userRepository;

    public SensorController(SensorRepository sensorRepository,
                            UserRepository userRepository) {
        this.sensorRepository = sensorRepository;
        this.userRepository = userRepository;
    }

    // Get all sensors
    @@Transactional(readOnly = true)
    @GetMapping
    public List<SensorNode> getAll() {
        return sensorRepository.getSensorsWithReadings();
    }

    // Get sensor by id
    @Transactional(readOnly = true)
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return sensorRepository.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.status(HttpStatus.NOT_FOUND)
                                .body(Map.of("error", "Sensor not found", "id", id))
                );
    }

    // Get sensors by status
    @Transactional(readOnly = true)
    @GetMapping("/status/{status}")
    public List<Sensor> getByStatus(@PathVariable String status) {
       return sensorRepository.findByStatus(status.toLowerCase());
    }

    // Get sensors by customer (farmer)
    @Transactional(readOnly = true)
    @GetMapping("/customer/{customerId}")
    public List<SensorNode> getByCustomer(@PathVariable UUID customerId) {
        return sensorRepository.findByCustomer_UserId(customerId);
    }

    // Get sensors by technician
    @Transactional(readOnly = true)
    @GetMapping("/technician/{technicianId}")
    @Transactional(readOnly = true)
    public List<SensorNode> getByTechnician(@PathVariable UUID technicianId) {
        return sensorRepository.findByTechnician_UserId(technicianId);
    }

    // Post 

    // Create a new sensor
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateSensorRequest req) {
        if (req.id() == null || req.id().isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Sensor id is required"));
        }

        if (req.name() == null || req.name().isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Sensor name is required"));
        }

        if (req.serialNumber() == null || req.serialNumber().isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Serial number is required"));
        }

        if (sensorRepository.existsBySerialNumber(req.serialNumber())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "Serial number already exists"));
        }

        if (sensorRepository.existsById(req.id())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Sensor id already exists"));
        }

        User customer = userRepository.findById(req.customerId()).orElse(null);
        if (customer == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Customer not found"));
        }

        User technician = userRepository.findById(req.technicianId()).orElse(null);
        if (technician == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Technician not found"));
        }

        Sensor sensor = new Sensor();
        sensor.setId(req.id());
        sensor.setName(req.name());
        sensor.setSerialNumber(req.serialNumber());
        sensor.setLatitude(req.latitude());
        sensor.setLongitude(req.longitude());

        sensor.setStatus("offline");
        sensor.setCustomer(customer);
        sensor.setTechnician(technician);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sensorRepository.save(sensor));
    }

    // Put 

    // Update basic sensor data
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id,
                                    @RequestBody SensorNode req) {
        SensorNode sensor = sensorRepository.findById(id).orElse(null);
        if (sensor == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Sensor not found", "id", id));
        }

        if (req.getName() != null) sensor.setName(req.getName());
        if (req.getStatus() != null) sensor.setStatus(req.getStatus().toLowerCase());
        sensor.setLatitude(req.getLatitude());
        sensor.setLongitude(req.getLongitude());

        sensor.setRssi(req.getRssi());
        sensor.setPacketLoss(req.getPacketLoss());
        sensor.setBattery(req.getBattery());

        return ResponseEntity.ok(sensorRepository.save(sensor));
    }

    // Assign customer / technician to sensor
    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assign(@PathVariable String id,
                                    @RequestBody AssignRequest req) {
        SensorNode sensor = sensorRepository.findById(id).orElse(null);
        if (sensor == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Sensor not found", "id", id));
        }


        // Assign customer
        if (req.customerId != null) {
            User customer = userRepository.findById(req.customerId).orElse(null);
            if (customer == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Customer not found"));
            }
            sensor.setCustomer(customer);
        }

        // Assign technician
        if (req.technicianId != null) {
            User technician = userRepository.findById(req.technicianId).orElse(null);
            if (technician == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Technician not found"));
            }
            sensor.setTechnician(technician);
        }

        return ResponseEntity.ok(sensorRepository.save(sensor));
    }

    // Delete sensor by id

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        if (!sensorRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Sensor not found"));
        }
        sensorRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Request Body

    // Simple request body for assign API
    public static class AssignRequest {
        public UUID customerId;
        public UUID technicianId;
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivate(@PathVariable String id) {
        SensorNode sensor = sensorRepository.findById(id).orElse(null);
        if (sensor == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Sensor not found", "id", id));
        }

        // If already deactivate, do nothing 
        if (sensor.getStatus() == HardwareStatus.DEACTIVATED) {
            return ResponseEntity.ok(sensor);
        }

        // Save current state -> saved_*
        sensor.setStatus(sensor.getStatus());
        sensor.setSavedRssi(sensor.getRssi());
        sensor.setSavedPacketLoss(sensor.getPacketLoss());
        sensor.setSavedBattery(sensor.getBattery());

        // Set to deactivate 
        sensor.setStatus(HardwareStatus.DEACTIVATED);
        sensor.setRssi(null);
        sensor.setPacketLoss(null);
        sensor.setBattery(null);

        return ResponseEntity.ok(sensorRepository.save(sensor));
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable String id) {
        SensorNode sensor = sensorRepository.findById(id).orElse(null);
        if (sensor == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Sensor not found", "id", id));
        }

        if (sensor.getSavedStatus() == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "No saved state to restore. Deactivate first."));
        }

        // Restore from saved_*
        sensor.setStatus(sensor.getSavedStatus());
        sensor.setRssi(sensor.getSavedRssi());
        sensor.setPacketLoss(sensor.getSavedPacketLoss());
        sensor.setBattery(sensor.getSavedBattery());
        // Clear saved state
        sensor.setSavedStatus(null);
        sensor.setSavedRssi(null);
        sensor.setSavedPacketLoss(null);
        sensor.setSavedBattery(null);

        return ResponseEntity.ok(sensorRepository.save(sensor));
    }


}



