package com.sote.FarmRa.model.dto;

import java.util.UUID;

public class ContactResponse {
    private UUID id;
    private String name;
    private String phone;
    private String email;
    private int nodes;

    public ContactResponse() {}

    public ContactResponse(UUID id, String name, String phone, String email, int nodes) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.nodes = nodes;
    }

    public UUID getId() {
        return id;
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

    public int getNodes() {
        return nodes;
    }

    public void setNodes(int nodes) {
        this.nodes = nodes;
    }
}
