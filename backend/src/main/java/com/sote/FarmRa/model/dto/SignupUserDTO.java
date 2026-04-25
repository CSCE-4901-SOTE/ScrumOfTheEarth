package com.sote.FarmRa.model.dto;

import lombok.Data;

@Data
public class SignupUserDTO {
    String email;
    String passwordHash;
    String phone;
    String role;
}