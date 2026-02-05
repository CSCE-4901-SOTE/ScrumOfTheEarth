package com.sote.FarmRa.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "sensors")
public class Sensor {

    @Id
    @Column(name = "id", nullable = false, length = 32)
    private String id; 

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "latitude", nullable = false)
    private double latitude;

    @Column(name = "longitude", nullable = false)
    private double longitude;

    // online / weak / offline / deactivate
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "rssi")
    private Integer rssi;

    @Column(name = "packet_loss")
    private Integer packetLoss;

    @Column(name = "battery")
    private Integer battery;

    @Column(name = "temperature")
    private Integer temperature;

    @Column(name = "moisture")
    private Integer moisture;

    @Column(name = "light")
    private Integer light;

    // Relationships

    // Customer (farmer)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User customer;

    // Technician
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User technician;

    // Saved State

    @Column(name = "saved_status", length = 20)
    private String savedStatus;

    @Column(name = "saved_rssi")
    private Integer savedRssi;

    @Column(name = "saved_packet_loss")
    private Integer savedPacketLoss;

    @Column(name = "saved_battery")
    private Integer savedBattery;

    @Column(name = "saved_temperature")
    private Integer savedTemperature;

    @Column(name = "saved_moisture")
    private Integer savedMoisture;

    @Column(name = "saved_light")
    private Integer savedLight;

    // Constructors

    public Sensor() {}

    // Getters and Setters

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public double getLatitude() { return latitude; }
    public void setLatitude(double latitude) { this.latitude = latitude; }

    public double getLongitude() { return longitude; }
    public void setLongitude(double longitude) { this.longitude = longitude; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getRssi() { return rssi; }
    public void setRssi(Integer rssi) { this.rssi = rssi; }

    public Integer getPacketLoss() { return packetLoss; }
    public void setPacketLoss(Integer packetLoss) { this.packetLoss = packetLoss; }

    public Integer getBattery() { return battery; }
    public void setBattery(Integer battery) { this.battery = battery; }

    public Integer getTemperature() { return temperature; }
    public void setTemperature(Integer temperature) { this.temperature = temperature; }

    public Integer getMoisture() { return moisture; }
    public void setMoisture(Integer moisture) { this.moisture = moisture; }

    public Integer getLight() { return light; }
    public void setLight(Integer light) { this.light = light; }

    public User getCustomer() { return customer; }
    public void setCustomer(User customer) { this.customer = customer; }

    public User getTechnician() { return technician; }
    public void setTechnician(User technician) { this.technician = technician; }

    public String getSavedStatus() { return savedStatus; }
    public void setSavedStatus(String savedStatus) { this.savedStatus = savedStatus; }

    public Integer getSavedRssi() { return savedRssi; }
    public void setSavedRssi(Integer savedRssi) { this.savedRssi = savedRssi; }

    public Integer getSavedPacketLoss() { return savedPacketLoss; }
    public void setSavedPacketLoss(Integer savedPacketLoss) { this.savedPacketLoss = savedPacketLoss; }

    public Integer getSavedBattery() { return savedBattery; }
    public void setSavedBattery(Integer savedBattery) { this.savedBattery = savedBattery; }

    public Integer getSavedTemperature() { return savedTemperature; }
    public void setSavedTemperature(Integer savedTemperature) { this.savedTemperature = savedTemperature; }

    public Integer getSavedMoisture() { return savedMoisture; }
    public void setSavedMoisture(Integer savedMoisture) { this.savedMoisture = savedMoisture; }

    public Integer getSavedLight() { return savedLight; }
    public void setSavedLight(Integer savedLight) { this.savedLight = savedLight; }
}
