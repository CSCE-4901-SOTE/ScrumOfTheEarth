package com.sote.FarmRa.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.sote.FarmRa.model.Role;


// Repository for working with the "role" table through the Role entity
public interface RoleRepository extends JpaRepository<Role, Long> {
    // Automatically generates the query: SELECT * FROM role WHERE name = ?
    Role findByName(String name);
    @Query("SELECT r FROM Role r WHERE LOWER(r.name) = LOWER(:name)")
    Role findByNameIgnoreCase(@Param("name") String name);
}
