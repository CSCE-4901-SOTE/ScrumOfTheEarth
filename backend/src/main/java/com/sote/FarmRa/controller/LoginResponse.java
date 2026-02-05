package com.example.backend.controller;

import java.util.UUID;

public class LoginResponse {
    private UUID userId;
    private String role;

    public LoginResponse(UUID userId, String role) {
        this.userId = userId;
        this.role = role;
    }

    public UUID getUserId() { return userId; }
    public String getRole() { return role; }
}
