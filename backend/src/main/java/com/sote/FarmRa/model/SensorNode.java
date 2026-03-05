package com.sote.FarmRa.model;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
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
@Setter
public class SensorNode {
    @Id
    //@GeneratedValue(strategy=GenerationType.AUTO)
    private String id;

    @OneToMany(mappedBy = "node")
    private List<SensorReadings> sensorReadings;

    @ManyToOne
    @JoinColumn(name="gateway_id")
    @Setter
    private Gateway gateway;

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

    private String name;
    private float longitude;
    private float latitude;
    private String serialNumber;
    private Integer rssi;
    private Integer packetLoss;
    private Integer battery;

    // Saved data
    @Enumerated(EnumType.STRING)
    private HardwareStatus savedStatus;

    private Integer savedRssi;
    private Integer savedPacketLoss;
    private Integer savedBattery;

    @Setter
    @Enumerated(EnumType.STRING)
    private HardwareStatus status;
}
