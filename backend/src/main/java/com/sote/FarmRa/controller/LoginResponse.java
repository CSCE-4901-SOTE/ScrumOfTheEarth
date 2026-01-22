package com.example.backend.controller;

public class LoginResponse {

    private String role;

    public LoginResponse(String role) {
        this.role = role;
    }

    public String getRole() {
        return role;
    }
}
