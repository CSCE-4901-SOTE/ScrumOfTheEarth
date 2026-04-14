package com.sote.FarmRa.model.dto;

import java.util.UUID;

public class ContactResponse {
    private UUID id;
    private UUID userId;
    private String name;
    private String phone;
    private String email;
    private Long nodes;

    public ContactResponse() {}

    public ContactResponse(UUID id, UUID userId, String name, String phone, String email, Long nodes){
        this.id = id;
        this.userId = userId;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.nodes = nodes;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Long getNodes() {
        return nodes;
    }

    public void setNodes(Long nodes) {
        this.nodes = nodes;
    }
}
