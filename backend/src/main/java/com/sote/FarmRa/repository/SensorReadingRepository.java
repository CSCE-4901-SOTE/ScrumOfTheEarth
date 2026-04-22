package com.sote.FarmRa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.sote.FarmRa.model.SensorReadings;

public interface SensorReadingRepository extends JpaRepository<SensorReadings, Long> {
    void deleteByNodeId(String nodeId);
}
