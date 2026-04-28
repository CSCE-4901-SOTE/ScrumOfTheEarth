package com.sote.FarmRa.controller;

import com.sote.FarmRa.entity.Role;
import com.sote.FarmRa.entity.User;
import com.sote.FarmRa.model.dto.SignupUserDTO;
import com.sote.FarmRa.security.JwtService;
import com.sote.FarmRa.service.UserService;
import com.sote.FarmRa.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUser(@PathVariable UUID id) {
        return userRepository.findById(id)
                .<ResponseEntity<?>>map(u -> {
                    Map<String, Object> body = new HashMap<>();
                    body.put("userId", u.getUserId());
                    body.put("email", u.getEmail() != null ? u.getEmail() : "");
                    body.put("phone", u.getPhone() != null ? u.getPhone() : "");
                    body.put("fullName", u.getFullName() != null ? u.getFullName() : "");
                    body.put("profileImage", u.getProfileImage() != null ? u.getProfileImage() : "");
                    return ResponseEntity.ok(body);
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id)
                .<ResponseEntity<?>>map(u -> {
                    if (body.containsKey("phone")) {
                        u.setPhone(body.get("phone"));
                    }

                    if (body.containsKey("fullName")) {
                        u.setFullName(body.get("fullName"));
                    } else if (body.containsKey("name")) {
                        u.setFullName(body.get("name"));
                    }

                    if (body.containsKey("profileImage")) {
                        u.setProfileImage(body.get("profileImage"));
                    }

                    userRepository.save(u);
                    return ResponseEntity.ok(Map.of("message", "Profile updated"));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupUserDTO req) {
    try {
        if (req.getEmail() == null || req.getEmail().isBlank())
            return ResponseEntity.badRequest().body("Email is required");
        if (req.getPasswordHash() == null || req.getPasswordHash().isBlank())
            return ResponseEntity.badRequest().body("Password is required");
        if (req.getPhone() == null || req.getPhone().isBlank())
            return ResponseEntity.badRequest().body("Phone is required");
        if(req.getRole() == null || req.getRole().isBlank()) {
            return ResponseEntity.badRequest().body("Role is required");
        }
        User u = new User();
        u.setEmail(req.getEmail());
        u.setPhone(req.getPhone());       
        u.setPasswordHash(req.getPasswordHash());
        u.setRole(
            Role.builder().name(req.getRole()).build()
        );

        User savedUser = userService.registerUser(u);
        return ResponseEntity.ok(savedUser);

    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body("Unexpected error: " + e.getMessage());
    }
}

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginRequest) {
        try {
            User user = userService.loginUser(
                    loginRequest.getEmail(),
                    loginRequest.getPasswordHash()
            );

            String role = user.getRole().getName().toLowerCase();
            String token = jwtService.generateToken(user.getUserId().toString(), role);

            return ResponseEntity.ok(new LoginResponse(
                    user.getUserId(),
                    role,
                    user.getFullName(),
                    token
            ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unexpected error: " + e.getMessage());
        }
    }
}
