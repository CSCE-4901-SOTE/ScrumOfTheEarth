package com.sote.FarmRa.service;

import com.sote.FarmRa.entity.Sensor;
import com.sote.FarmRa.model.Alert;
import com.sote.FarmRa.model.AlertType;
import com.sote.FarmRa.model.SensorReadings;
import com.sote.FarmRa.model.dto.AlertDTO;
import com.sote.FarmRa.repository.AlertRepository;
import com.sote.FarmRa.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertService {

    private static final float LOW_MOISTURE_THRESHOLD = 20.0f;
    private static final float HIGH_TEMP_THRESHOLD = 95.0f;
    private static final int LOW_BATTERY_THRESHOLD = 20;
    private static final int LOW_SIGNAL_THRESHOLD = -80;

    private final AlertRepository alertRepository;
    private final SensorRepository sensorRepository;

    public void checkAndCreateAlerts(Sensor node, SensorReadings reading) {
        if (reading.getMoisture() < LOW_MOISTURE_THRESHOLD) {
            createAlertIfNotExists(node, AlertType.LOW_MOISTURE,
                String.format("Moisture level is %.1f%% (threshold: 20%%)", reading.getMoisture()));
        }
        if (reading.getTemperature() > HIGH_TEMP_THRESHOLD) {
            createAlertIfNotExists(node, AlertType.HIGH_TEMPERATURE,
                String.format("Temperature is %.1f°F (threshold: 95°F)", reading.getTemperature()));
        }
        if (node.getBattery() != null && node.getBattery() < LOW_BATTERY_THRESHOLD) {
            createAlertIfNotExists(node, AlertType.LOW_BATTERY,
                String.format("Battery is at %d%% (threshold: 20%%)", node.getBattery()));
        }
    }

    private boolean isLowSignal(Sensor node) {
        if (node.getStatus().toLowerCase() == "weak") return true;
        //return node.getRssi() != null && node.getRssi() < LOW_SIGNAL_THRESHOLD;
        return false;
    }

    private void createAlertIfNotExists(Sensor node, AlertType type, String message) {
        if (alertRepository.existsBySensorIdAndAlertTypeAndAcknowledgedFalse(node.getId(), type)) {
            return;
        }
        Alert alert = Alert.builder()
            .sensorId(node.getId())
            .sensorName(node.getName())
            .alertType(type)
            .message(message)
            .createdAt(Instant.now())
            .acknowledged(false)
            .build();
        alertRepository.save(alert);
    }

    public List<AlertDTO> getAlerts() {
        return alertRepository.findAllByOrderByCreatedAtDesc()
            .stream()
            .map(this::toDto)
            .collect(Collectors.toList());
    }

    public void acknowledge(UUID id) {
        alertRepository.findById(id).ifPresent(alert -> {
            alert.setAcknowledged(true);
            alertRepository.save(alert);
        });
    }

    private AlertDTO toDto(Alert a) {
        return new AlertDTO(
            a.getId(),
            a.getSensorId(),
            a.getSensorName(),
            a.getAlertType(),
            a.getMessage(),
            a.getCreatedAt(),
            a.isAcknowledged()
        );
    }
}
