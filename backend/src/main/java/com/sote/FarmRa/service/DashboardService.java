package com.sote.FarmRa.service;

import com.sote.FarmRa.model.dto.DashboardDTO;
import com.sote.FarmRa.model.dto.SensorDTO;
import com.sote.FarmRa.entity.Sensor;
import com.sote.FarmRa.repository.SensorRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.List;

@Service
public class DashboardService {

    private final SensorRepository sensorRepository;

    public DashboardService(SensorRepository sensorRepository) {
        this.sensorRepository = sensorRepository;
    }

    public List<SensorDTO> getSensorsByCustomer(UUID customerId) {
        return sensorRepository.findByCustomer_UserId(customerId)
            .stream()
            .map(this::toSensorDto)
            .toList();
    }

    public List<SensorDTO> getSensorsByTechnician(UUID technicianId) {
        return sensorRepository.findByTechnician_UserId(technicianId)
            .stream()
            .map(this::toSensorDto)
            .toList();
    }

    /**
     * Dashboard: return sensors for map + inventory table
     */
    public List<SensorDTO> getSensors() {
        return sensorRepository.findAll()
                .stream()
                .map(this::toSensorDto)
                .toList();
    }

    /**
     * Dashboard: summary boxes
     * v1: deltaToday = 0 (need baseline/log to calculate "today" properly)
     */
    public DashboardDTO getSummary() {
        long total = sensorRepository.count();
        long deactivated = sensorRepository.countByStatus("deactivate");
        long active = total - deactivated;

        return new DashboardDTO(
                (int) active,
                0,                // activeDeltaToday (v1)
                (int) deactivated,
                0                 // deactivatedDeltaToday (v1)
        );
    }

    // Helpers
    private SensorDTO toSensorDto(Sensor s) {
        return new SensorDTO(
                s.getId(),
                s.getName(),
                s.getLatitude(),
                s.getLongitude(),
                s.getStatus(),
                s.getBattery(),
                s.getLastSeen()
        );
    }
}
