package com.sote.FarmRa.model.dto;

import java.util.UUID;

public class LoginResponse {
    private UUID userId;
    private String role;
    private String fullName;

    public LoginResponse(UUID userId, String role, String fullName) {
        this.userId = userId;
        this.role = role;
        this.fullName = fullName;
    }

    public UUID getUserId() { return userId; }
    public String getRole() { return role; }
    public String getFullName() { return fullName; }
}