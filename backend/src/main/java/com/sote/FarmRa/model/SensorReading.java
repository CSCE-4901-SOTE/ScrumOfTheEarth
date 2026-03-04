package com.sote.FarmRa.model;

import java.time.Instant;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorReading {
    @Id
    @GeneratedValue(strategy=GenerationType.AUTO)
    private String id;
    
    @ManyToOne
    @JoinColumn(name="node_id")
    @Setter
    private SensorNode node;
    
    private Instant createdAt;

    private float moisture;
    private float temperature;
    private boolean light;
    //private float batteryLevel;
}
