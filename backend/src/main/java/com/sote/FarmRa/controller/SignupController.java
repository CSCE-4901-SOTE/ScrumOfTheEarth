package com.sote.FarmRa.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class SignupController {

  private final InMemoryUserDetailsManager users;
  private final PasswordEncoder encoder;

  public SignupController(InMemoryUserDetailsManager users, PasswordEncoder encoder) {
    this.users = users;
    this.encoder = encoder;
  }

  // { email, phone, passwordHash, role: { name } }
  public static class SignupRequest {
    public String email;
    public String phone;
    public String passwordHash;
    public Role role;

    public static class Role {
      public String name;
    }
  }

  @PostMapping("/signup")
  public ResponseEntity<?> signup(@RequestBody SignupRequest body) {
    if (body == null || body.email == null || body.email.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("error", "email is required"));
    }
    if (body.passwordHash == null || body.passwordHash.isBlank()) {
      return ResponseEntity.badRequest().body(Map.of("error", "passwordHash is required"));
    }

    if (users.userExists(body.email)) {
      return ResponseEntity.status(409).body(Map.of("error", "User already exists"));
    }

    String roleName = "FARMER";
    if (body.role != null && body.role.name != null && !body.role.name.isBlank()) {
      String r = body.role.name.toUpperCase();
      if (r.contains("TECH")) roleName = "TECHNICIAN";
      else if (r.contains("ADMIN")) roleName = "ADMIN";
      else if (r.contains("CUSTOM")) roleName = "CUSTOMER";
      else if (r.contains("FARM")) roleName = "FARMER";
    }

    users.createUser(
      User.withUsername(body.email)
        .password(encoder.encode(body.passwordHash))
        .roles(roleName)
        .build()
    );

    return ResponseEntity.ok(Map.of(
      "email", body.email,
      "phone", body.phone == null ? "" : body.phone,
      "role", roleName
    ));
  }
}
