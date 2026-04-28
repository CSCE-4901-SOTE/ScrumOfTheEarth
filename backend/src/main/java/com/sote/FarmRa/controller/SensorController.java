package com.sote.FarmRa.controller;

import com.sote.FarmRa.entity.Sensor;
import com.sote.FarmRa.entity.User;
import com.sote.FarmRa.model.dto.UpdateSensorRequest;
import com.sote.FarmRa.model.dto.CreateSensorRequest;
import com.sote.FarmRa.model.dto.CreateSensorResponse;
import com.sote.FarmRa.repository.SensorRepository;
import com.sote.FarmRa.repository.UserRepository;
import com.sote.FarmRa.repository.SensorReadingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
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
    private final SensorReadingRepository sensorReadingRepository;

    public SensorController(SensorRepository sensorRepository,
                            UserRepository userRepository,
                            SensorReadingRepository sensorReadingRepository) {
        this.sensorRepository = sensorRepository;
        this.userRepository = userRepository;
        this.sensorReadingRepository = sensorReadingRepository;
    }

    // Get all sensors
    @Transactional(readOnly = true)
    @GetMapping
    public List<Sensor> getAll() {
        return sensorRepository.findAll();
    }

    // Get sensor by id
    @Transactional(readOnly = true)
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        Sensor sensor = sensorRepository.findById(id).orElseGet(null);
        if(sensor != null) {
            CreateSensorResponse resp = CreateSensorResponse.builder()
                .id(sensor.getId())
                .name(sensor.getName())
                .latitude(sensor.getLatitude())
                .longitude(sensor.getLongitude())
                .serialNumber(sensor.getSerialNumber())
                .customerId(sensor.getCustomer().getUserId().toString())
                .build();
            return ResponseEntity.status(HttpStatus.OK).body(resp);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Sensor not found", "id", id));
        }
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
    public List<Sensor> getByCustomer(@PathVariable UUID customerId) {
        return sensorRepository.findByCustomer_UserId(customerId);
    }

    // Get sensors by technician
    @Transactional(readOnly = true)
    @GetMapping("/technician/{technicianId}")
    public List<Sensor> getByTechnician(@PathVariable UUID technicianId) {
        return sensorRepository.findByTechnician_UserId(technicianId);
    }

    // Create a new sensor
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateSensorRequest req) {
        try {
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

            Sensor saved = sensorRepository.saveAndFlush(sensor);
            CreateSensorResponse resp = CreateSensorResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .latitude(saved.getLatitude())
                .longitude(saved.getLongitude())
                .status(saved.getStatus())
                .lastSeen(saved.getLastSeen())
                .serialNumber(saved.getSerialNumber())
                .customerId(customer.getUserId().toString())
                .battery(saved.getBattery())
                .temperature(saved.getTemperature())
                .moisture(saved.getMoisture())
                .light(saved.getLight())
                .technicianName(technician.getFullName())
                .customerName(customer.getFullName())
                .build();

            return ResponseEntity.status(HttpStatus.CREATED).body(resp);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Create sensor failed: " + e.getMessage()));
        }
    }

    // Update basic sensor data
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id,
                                    @RequestBody UpdateSensorRequest req) {
        Sensor sensor = sensorRepository.findById(id).orElse(null);
        if (sensor == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Sensor not found", "id", id));
        }

        if (req.name() != null && !req.name().isBlank()) {
            sensor.setName(req.name());
        }

        if (req.latitude() != null) {
            sensor.setLatitude(req.latitude());
        }

        if (req.longitude() != null) {
            sensor.setLongitude(req.longitude());
        }

        if (req.customerId() != null) {
            User customer = userRepository.findById(req.customerId()).orElse(null);
            if (customer == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Customer not found"));
            }
            sensor.setCustomer(customer);
        }

        return ResponseEntity.ok(sensorRepository.save(sensor));
    }

    // Assign customer / technician to sensor
    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assign(@PathVariable String id,
                                    @RequestBody AssignRequest req) {
        Sensor sensor = sensorRepository.findById(id).orElse(null);
        if (sensor == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Sensor not found", "id", id));
        }

        if (req.customerId != null) {
            User customer = userRepository.findById(req.customerId).orElse(null);
            if (customer == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Customer not found"));
            }
            sensor.setCustomer(customer);
        }

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

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable String id) {
        try {
            if (!sensorRepository.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Sensor not found"));
            }

            sensorReadingRepository.deleteByNodeId(id);
            sensorRepository.deleteById(id);
            sensorRepository.flush();

            return ResponseEntity.ok(Map.of("message", "Sensor deleted successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete sensor: " + e.getMessage()));
        }
    }

    public static class AssignRequest {
        public UUID customerId;
        public UUID technicianId;
    }
}



