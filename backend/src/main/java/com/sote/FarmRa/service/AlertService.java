package com.sote.FarmRa.service;

import com.sote.FarmRa.entity.Sensor;
import com.sote.FarmRa.model.Alert;
import com.sote.FarmRa.model.AlertType;
import com.sote.FarmRa.model.SensorReadings;
import com.sote.FarmRa.model.dto.AlertDTO;
import com.sote.FarmRa.repository.AlertRepository;
import com.sote.FarmRa.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertService {

    private static final float LOW_MOISTURE_THRESHOLD = 20.0f;
    private static final float HIGH_TEMP_THRESHOLD = 95.0f;
    private static final int LOW_BATTERY_THRESHOLD = 20;

    private final AlertRepository alertRepository;
    private final SensorRepository sensorRepository;
    private final JdbcTemplate jdbcTemplate;

    @Scheduled(fixedDelay = 600000)
    public void runScheduledAlertChecks() {
        String sql = """
            SELECT DISTINCT ON (sn.id)
                sn.id       AS sensor_id,
                sn.battery  AS battery,
                sn.status   AS status,
                COALESCE(sr.temperature, 0) AS temperature,
                COALESCE(sr.moisture, 0)    AS moisture
            FROM public.sensor_node sn
            LEFT JOIN public.sensor_readings_test sr ON sr.node_id = sn.id
            ORDER BY sn.id, sr.created_at DESC NULLS LAST
            """;

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        for (Map<String, Object> row : rows) {
            String sensorId = (String) row.get("sensor_id");
            sensorRepository.findById(sensorId).ifPresent(sensor -> {
                float temp = ((Number) row.get("temperature")).floatValue();
                float moisture = ((Number) row.get("moisture")).floatValue();

                if (moisture < LOW_MOISTURE_THRESHOLD) {
                    createAlertIfNotExists(sensor, AlertType.LOW_MOISTURE,
                        String.format("Moisture level is %.1f%% (threshold: 20%%)", moisture));
                } else {
                    autoResolve(sensorId, AlertType.LOW_MOISTURE);
                }

                if (temp > HIGH_TEMP_THRESHOLD) {
                    createAlertIfNotExists(sensor, AlertType.HIGH_TEMPERATURE,
                        String.format("Temperature is %.1f°F (threshold: 95°F)", temp));
                } else {
                    autoResolve(sensorId, AlertType.HIGH_TEMPERATURE);
                }

                if (sensor.getBattery() != null && sensor.getBattery() < LOW_BATTERY_THRESHOLD) {
                    createAlertIfNotExists(sensor, AlertType.LOW_BATTERY,
                        String.format("Battery is at %d%% (threshold: 20%%)", sensor.getBattery()));
                } else {
                    autoResolve(sensorId, AlertType.LOW_BATTERY);
                }

                if (isLowSignal(sensor)) {
                    createAlertIfNotExists(sensor, AlertType.LOW_SIGNAL,
                        String.format("Sensor signal is weak (status: %s)", sensor.getStatus()));
                } else {
                    autoResolve(sensorId, AlertType.LOW_SIGNAL);
                }
            });
        }
    }

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
        return "weak".equalsIgnoreCase(node.getStatus());
    }

    private void autoResolve(String sensorId, AlertType type) {
        alertRepository.findBySensorIdAndAlertTypeAndAcknowledgedFalse(sensorId, type)
            .ifPresent(alert -> {
                alert.setAcknowledged(true);
                alertRepository.save(alert);
            });
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
