package com.sote.FarmRa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
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

    // online / weak / offline / deactivate
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

    // ✅ for dashboard "Last Seen"
    @Column(name = "last_seen")
    private Instant lastSeen;

    // Relationships
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User customer;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "technician_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User technician;

    // Constructors
    public Sensor() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getBattery() { return battery; }
    public void setBattery(Integer battery) { this.battery = battery; }

    public Integer getTemperature() { return temperature; }
    public void setTemperature(Integer temperature) { this.temperature = temperature; }

    public Integer getMoisture() { return moisture; }
    public void setMoisture(Integer moisture) { this.moisture = moisture; }

    public Integer getLight() { return light; }
    public void setLight(Integer light) { this.light = light; }

    public Instant getLastSeen() { return lastSeen; }
    public void setLastSeen(Instant lastSeen) { this.lastSeen = lastSeen; }

    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }

    public User getTechnician() { return technician; }
    public void setTechnician(User technician) { this.technician = technician; }
}
