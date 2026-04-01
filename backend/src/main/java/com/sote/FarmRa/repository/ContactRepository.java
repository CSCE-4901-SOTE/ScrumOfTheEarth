package com.sote.FarmRa.repository;

import com.sote.FarmRa.repository.ContactResponse;
import com.sote.FarmRa.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContactRepository extends JpaRepository<Contact, UUID> {
    boolean existsByOwnerIdAndUserId(UUID ownerId, UUID userId);

    List<Contact> findByOwnerId(UUID ownerId);

    List<Contact> findByUserId(UUID userId);

    Optional<Contact> findByIdAndOwnerId(UUID id, UUID ownerId);

    @Query("""
        SELECT new com.example.backend.dto.ContactResponse(
            c.id,
            u.fullName,
            u.phone,
            u.email,
            0
        )
        FROM Contact c
        JOIN User u ON c.userId = u.userId
        WHERE c.ownerId = :ownerId
    """)
    List<ContactResponse> findTechnicianContactResponses(UUID ownerId);

    @Query("""
        SELECT new com.example.backend.dto.ContactResponse(
            c.id,
            u.fullName,
            u.phone,
            u.email,
            0
        )
        FROM Contact c
        JOIN User u ON c.ownerId = u.userId
        WHERE c.userId = :userId
    """)
    List<ContactResponse> findFarmerContactResponses(UUID userId);
}
