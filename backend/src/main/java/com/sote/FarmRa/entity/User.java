package com.sote.FarmRa.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;
import java.util.UUID;

@Entity
@Getter
@Setter
@Table(name = "users")

public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID userId;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "full_name")
    private String name;

    @Column(nullable = false)
    private String phone;

    @ManyToOne
    @JoinColumn(name = "role_id")
    private Role role;

    @Column(name = "full_name")
    private String fullName;

    @Column(nullable = false)
    private String passwordHash;

    private Instant createdAt = Instant.now();

    @Column(name = "profile_image", columnDefinition = "text")
    private String profileImage;

    public String getFullName() {
        return fullName;
    }
}
