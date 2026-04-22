package com.sote.FarmRa.controller;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "sensor_node")
public class Sensor {

    @Id
    @Column(name = "id", nullable = false, length = 32)
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "serial_number", nullable = false, unique = true)
    private String serialNumber;

    @Column(name = "latitude", nullable = false)
    private double latitude;

    @Column(name = "longitude", nullable = false)
    private double longitude;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "battery")
    private Integer battery;

    @Column(name = "temperature")
    private Integer temperature;

    @Column(name = "moisture")
    private Integer moisture;

    @Column(name = "light")
    private Integer light;

    @Column(name = "last_seen")
    private Instant lastSeen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User technician;
}
