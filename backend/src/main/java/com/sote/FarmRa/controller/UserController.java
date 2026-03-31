package com.sote.FarmRa.controller;

import com.sote.FarmRa.model.User;
import com.sote.FarmRa.repository.UserRepository;
import com.sote.FarmRa.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/users/{id}")
    public ResponseEntity<?> getUser(@PathVariable UUID id) {
        return userRepository.findById(id)
            .<ResponseEntity<?>>map(u -> {
                java.util.Map<String, Object> body = new java.util.HashMap<>();
                body.put("userId", u.getUserId().toString());
                body.put("email", u.getEmail());
                body.put("phone", u.getPhone() != null ? u.getPhone() : "");
                body.put("name", u.getName() != null ? u.getName() : "");
                return ResponseEntity.ok(body);
            })
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).<ResponseEntity<?>>map(u -> {
            if (body.containsKey("phone")) u.setPhone(body.get("phone"));
            if (body.containsKey("name")) u.setName(body.get("name"));
            userRepository.save(u);
            return ResponseEntity.ok(Map.of("message", "Profile updated"));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User user) {
        try {
            User savedUser = userService.registerUser(user);
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

            // ✅ Return both userId + role
            return ResponseEntity.ok(new LoginResponse(user.getUserId(), role));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unexpected error: " + e.getMessage());
        }
    }
}
