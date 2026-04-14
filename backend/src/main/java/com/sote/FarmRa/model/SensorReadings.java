package com.sote.FarmRa.model;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sote.FarmRa.entity.Sensor;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
public class SensorReadings {
    @Id
    //@GeneratedValue(strategy=GenerationType.AUTO)
    private String id;
    
    @ManyToOne
    @JoinColumn(name="node_id")
    @Setter
    @JsonIgnore
    private Sensor node;
    
    private Instant createdAt;

    private float moisture;
    private float temperature;
    private boolean light;
    //private float batteryLevel;
}
