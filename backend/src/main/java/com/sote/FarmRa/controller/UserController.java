package com.sote.FarmRa.controller;

import com.sote.FarmRa.entity.User;          // <-- if this import is wrong, see note below
import com.sote.FarmRa.service.UserService;  // <-- if this import is wrong, see note below
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    @Autowired
    private UserService userService;

    public static class SignupRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    @PostMapping("/signup")
public ResponseEntity<?> signup(@RequestBody SignupRequest req) {
    try {
        if (req.getEmail() == null || req.getEmail().isBlank())
            return ResponseEntity.badRequest().body("Email is required");
        if (req.getPassword() == null || req.getPassword().isBlank())
            return ResponseEntity.badRequest().body("Password is required");

        User u = new User();
        u.setEmail(req.getEmail());
        u.setPhone("9999999999");       
        u.setPasswordHash(req.getPassword());

        User savedUser = userService.registerUser(u);
        return ResponseEntity.ok(savedUser);

    } catch (IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    } catch (Exception e) {
        return ResponseEntity.internalServerError().body("Unexpected error: " + e.getMessage());
    }
}

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        try {
            if (req.getEmail() == null || req.getEmail().isBlank())
                return ResponseEntity.badRequest().body("Email is required");
            if (req.getPassword() == null || req.getPassword().isBlank())
                return ResponseEntity.badRequest().body("Password is required");

            User user = userService.loginUser(req.getEmail(), req.getPassword());

            String role = (user.getRole() != null && user.getRole().getName() != null)
                    ? user.getRole().getName().toLowerCase()
                    : "user";

            return ResponseEntity.ok(new LoginResponse(user.getUserId(), role));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Unexpected error: " + e.getMessage());
        }
    }

    // ✅ Response DTO
    public static class LoginResponse {
        private UUID userId;
        private String role;

        public LoginResponse(UUID userId, String role) {
            this.userId = userId;
            this.role = role;
        }

        public UUID getUserId() { return userId; }
        public String getRole() { return role; }
    }
}
