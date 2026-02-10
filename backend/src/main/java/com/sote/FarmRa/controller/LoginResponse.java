package com.sote.FarmRa.controller;

import java.util.UUID;

public class LoginResponse {
    private UUID userId;
    private String role;
    private String token;

    public LoginResponse(UUID userId, String role, String token) {
        this.userId = userId;
        this.role = role;
        this.token = token;
    }

    public UUID getUserId() { return userId; }
    public String getRole() { return role; }
    public String getToken() { return token; }
}
