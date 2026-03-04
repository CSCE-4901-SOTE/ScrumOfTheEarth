package com.sote.FarmRa.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sote.FarmRa.model.HardwareStatus;
import com.sote.FarmRa.model.SensorNode;

import java.util.List;
import java.util.UUID;

public interface SensorRepository extends JpaRepository<SensorNode, String> {

    // Get sensors owned by a specific customer (farmer)
    List<SensorNode> findByCustomer_UserId(UUID userId);

    // Get sensors assigned to a specific technician
    List<SensorNode> findByTechnician_UserId(UUID userId);

    // Filter sensors by status (online/weak/offline/deactivate)
    List<SensorNode> findByStatus(HardwareStatus status);
}
