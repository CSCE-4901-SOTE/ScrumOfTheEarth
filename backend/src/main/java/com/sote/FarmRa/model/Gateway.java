package com.sote.FarmRa.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
@AllArgsConstructor
public class Gateway {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    /*
    @OneToMany(mappedBy = "gateway")
    private List<Sensor> sensorNodes;
    */
    @Enumerated(EnumType.STRING)
    private HardwareStatus gatewayStatus;

    private String gatewayName;
}
