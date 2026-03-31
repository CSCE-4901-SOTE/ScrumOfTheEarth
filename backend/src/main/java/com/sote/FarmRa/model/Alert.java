package com.sote.FarmRa.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "alert")
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String sensorId;
    private String sensorName;

    @Enumerated(EnumType.STRING)
    private AlertType alertType;

    private String message;
    private Instant createdAt;
    private boolean acknowledged;
}
