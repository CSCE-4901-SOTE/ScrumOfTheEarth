package com.sote.FarmRa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.sote.FarmRa.model.HardwareStatus;
import com.sote.FarmRa.model.SensorNode;

import java.util.List;
import java.util.UUID;

public interface SensorRepository extends JpaRepository<SensorNode, String> {

    @Query("""
        SELECT s FROM SensorNode s
        LEFT JOIN FETCH s.sensorReadings sr
        LEFT JOIN FETCH s.customer
        LEFT JOIN FETCH s.technician
        LEFT JOIN FETCH s.gateway
        order by sr.createdAt DESC
            """)
    List<SensorNode> getSensorsWithReadings();

    @Query("""
        SELECT s FROM SensorNode s
        LEFT JOIN FETCH s.sensorReadings sr
        LEFT JOIN FETCH s.customer
        LEFT JOIN FETCH s.technician t
        LEFT JOIN FETCH s.gateway
        where t.userId = :techId
        order by sr.createdAt DESC
            """)
    List<SensorNode> getSensorsWithReadingsByTechId(UUID techId);

    // Get sensors owned by a specific customer (farmer)
    List<SensorNode> findByCustomer_UserId(UUID userId);

    // Get sensors assigned to a specific technician
    List<SensorNode> findByTechnician_UserId(UUID userId);

    // Filter sensors by status (online/weak/offline/deactivate)
    List<SensorNode> findByStatus(HardwareStatus status);

    // Dashboard: count sensors by status
    long countByStatus(String status);

    // Filter by multiple statuses
    List<Sensor> findByStatusIn(List<String> statuses);
}
