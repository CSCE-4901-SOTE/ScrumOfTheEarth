package com.sote.FarmRa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.sote.FarmRa.model.SensorReading;

public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {
    
}
