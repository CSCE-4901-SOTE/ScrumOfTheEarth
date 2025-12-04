package com.sote.FarmRa.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.sote.FarmRa.model.SensorNode;

public interface SensorRepository extends JpaRepository<SensorNode, Long> {
    
}
