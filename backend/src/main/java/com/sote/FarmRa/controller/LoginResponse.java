package com.sote.FarmRa.controller;

import java.util.UUID;

public class LoginResponse {
    private UUID userId;
    private String role;
    private String fullName;
    private String token;

    public LoginResponse(UUID userId, String role, String fullName, String token) {
        this.userId = userId;
        this.role = role;
        this.fullName = fullName;
        this.token = token;
    }

    public UUID getUserId() { return userId; }
    public String getRole() { return role; }
    public String getFullName() { return fullName; }
    public String getToken() { return token; }
}
