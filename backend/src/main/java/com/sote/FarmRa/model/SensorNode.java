package com.sote.FarmRa.model;

import java.util.List;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
@AllArgsConstructor
public class SensorNode {
    @Id
    @GeneratedValue(strategy=GenerationType.AUTO)
    private Long id;

    @OneToMany(mappedBy = "node")
    private List<SensorReading> sensorReadings;

    @ManyToOne
    @JoinColumn(name="gateway_id")
    private Gateway gateway;

    private float longitude;
    private float latitude;
    private String serialNumber;
    private float batteryLevel;
    private HardwareStatus sensorStatus;
}
