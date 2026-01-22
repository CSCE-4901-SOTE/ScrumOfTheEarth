package com.example.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.backend.entity.User;
import com.example.backend.entity.Role;
import com.example.backend.repository.UserRepository;
import com.example.backend.repository.RoleRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.regex.Pattern;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User registerUser(User user) {

        // Check email format
        if (!Pattern.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$", user.getEmail())) {
            throw new IllegalArgumentException("Invalid email format");
        }

        // Check phone number format
        if (!Pattern.matches("^\\d{10,15}$", user.getPhone())) {
            throw new IllegalArgumentException("Invalid phone number");
        }

        // Check for strong password
        if (!Pattern.matches("^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$", user.getPasswordHash())) {
            throw new IllegalArgumentException("Password must be 8+ chars with uppercase, number, and symbol.");
        }

        // Check for duplicate email
        if (userRepository.findByEmail(user.getEmail()) != null) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Check for valid role (based on the name sent from the frontend)
        if (user.getRole() == null || user.getRole().getName() == null) {
            throw new IllegalArgumentException("Role is required");
        }

        Role role = roleRepository.findByNameIgnoreCase(user.getRole().getName());
        if (role == null) {
            throw new IllegalArgumentException("Invalid role: " + user.getRole().getName());
        }

        // Encrypt password using BCrypt
        String hashedPassword = passwordEncoder.encode(user.getPasswordHash());
        user.setPasswordHash(hashedPassword);

        // Assign role and save user
        user.setRole(role);
        return userRepository.save(user);
    }

    // Handle user login
    public User loginUser(String email, String password) {
        // Find user by email
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }

        // Check if password matches
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Incorrect password");
        }

        // Return user info (successful login)
        return user;
}

}
