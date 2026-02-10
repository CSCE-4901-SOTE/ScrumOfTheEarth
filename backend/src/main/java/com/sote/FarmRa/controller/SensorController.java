package com.sote.FarmRa.controller;

import com.sote.FarmRa.entity.Sensor;
import com.sote.FarmRa.entity.User;
import com.sote.FarmRa.repository.SensorRepository;
import com.sote.FarmRa.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:4200")  
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

    // Get

    // Get all sensors
    @GetMapping
    public List<Sensor> getAll() {
        return sensorRepository.findAll();
    }

    // Get sensor by id
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
    @GetMapping("/status/{status}")
    public List<Sensor> getByStatus(@PathVariable String status) {
        return sensorRepository.findByStatus(status);
    }

    // Get sensors by customer (farmer)
    @GetMapping("/customer/{customerId}")
    public List<Sensor> getByCustomer(@PathVariable UUID customerId) {
        return sensorRepository.findByCustomer_UserId(customerId);
    }

    // Get sensors by technician
    @GetMapping("/technician/{technicianId}")
    public List<Sensor> getByTechnician(@PathVariable UUID technicianId) {
        return sensorRepository.findByTechnician_UserId(technicianId);
    }

    // Post 

    // Create a new sensor
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Sensor sensor) {
        if (sensor.getId() == null || sensor.getId().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Sensor id is required"));
        }

        if (sensorRepository.existsById(sensor.getId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Sensor id already exists"));
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sensorRepository.save(sensor));
    }

    // Put 

    // Update basic sensor data
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id,
                                    @RequestBody Sensor req) {
        Sensor sensor = sensorRepository.findById(id).orElse(null);
        if (sensor == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Sensor not found", "id", id));
        }

        if (req.getName() != null) sensor.setName(req.getName());
        if (req.getStatus() != null) sensor.setStatus(req.getStatus());
        if (req.getLatitude() != 0) sensor.setLatitude(req.getLatitude());
        if (req.getLongitude() != 0) sensor.setLongitude(req.getLongitude());

        sensor.setRssi(req.getRssi());
        sensor.setPacketLoss(req.getPacketLoss());
        sensor.setBattery(req.getBattery());
        sensor.setTemperature(req.getTemperature());
        sensor.setMoisture(req.getMoisture());
        sensor.setLight(req.getLight());

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
        Sensor sensor = sensorRepository.findById(id).orElse(null);
        if (sensor == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Sensor not found", "id", id));
        }

        // If already deactivate, do nothing 
        if ("deactivate".equalsIgnoreCase(sensor.getStatus())) {
            return ResponseEntity.ok(sensor);
        }

        // Save current state -> saved_*
        sensor.setSavedStatus(sensor.getStatus());
        sensor.setSavedRssi(sensor.getRssi());
        sensor.setSavedPacketLoss(sensor.getPacketLoss());
        sensor.setSavedBattery(sensor.getBattery());
        sensor.setSavedTemperature(sensor.getTemperature());
        sensor.setSavedMoisture(sensor.getMoisture());
        sensor.setSavedLight(sensor.getLight());

        // Set to deactivate 
        sensor.setStatus("deactivate");
        sensor.setRssi(null);
        sensor.setPacketLoss(null);
        sensor.setBattery(null);
        sensor.setTemperature(null);
        sensor.setMoisture(null);
        sensor.setLight(null);

        return ResponseEntity.ok(sensorRepository.save(sensor));
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activate(@PathVariable String id) {
        Sensor sensor = sensorRepository.findById(id).orElse(null);
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
        sensor.setTemperature(sensor.getSavedTemperature());
        sensor.setMoisture(sensor.getSavedMoisture());
        sensor.setLight(sensor.getSavedLight());

        // Clear saved state
        sensor.setSavedStatus(null);
        sensor.setSavedRssi(null);
        sensor.setSavedPacketLoss(null);
        sensor.setSavedBattery(null);
        sensor.setSavedTemperature(null);
        sensor.setSavedMoisture(null);
        sensor.setSavedLight(null);

        return ResponseEntity.ok(sensorRepository.save(sensor));
    }


}
