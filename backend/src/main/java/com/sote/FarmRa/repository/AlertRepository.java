package com.sote.FarmRa.repository;

import com.sote.FarmRa.model.Alert;
import com.sote.FarmRa.model.AlertType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AlertRepository extends JpaRepository<Alert, UUID> {

    List<Alert> findAllByOrderByCreatedAtDesc();

    boolean existsBySensorIdAndAlertTypeAndAcknowledgedFalse(String sensorId, AlertType alertType);
}
