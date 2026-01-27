package com.sote.FarmRa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.sote.FarmRa.entity.User;

// Repository for working with the "users" table through the User entity
public interface UserRepository extends JpaRepository<User, java.util.UUID> {
    // Automatically generates the query: SELECT * FROM users WHERE email = ?
    User findByEmail(String email);
}
