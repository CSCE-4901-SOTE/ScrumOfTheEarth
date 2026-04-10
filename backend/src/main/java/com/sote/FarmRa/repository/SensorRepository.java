package com.sote.FarmRa.repository;

import com.sote.FarmRa.entity.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SensorRepository extends JpaRepository<Sensor, String> {

    // Get sensors owned by a specific customer (farmer)
    List<Sensor> findByCustomer_UserId(UUID userId);

    // Get sensors assigned to a specific technician
    List<Sensor> findByTechnician_UserId(UUID userId);

    // Filter sensors by status (online/weak/offline/deactivate)
    List<Sensor> findByStatus(String status);

    // Dashboard: count sensors by status
    long countByStatus(String status);

    // Optional: filter by multiple statuses
    List<Sensor> findByStatusIn(List<String> statuses);

    boolean existsBySerialNumber(String serialNumber);
}
