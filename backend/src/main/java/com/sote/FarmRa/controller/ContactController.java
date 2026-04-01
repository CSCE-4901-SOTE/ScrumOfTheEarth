package com.example.backend.controller;

import com.example.backend.dto.AddContactRequest;
import com.example.backend.dto.ContactResponse;
import com.example.backend.service.ContactService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@CrossOrigin(origins = {"http://localhost:4200", "http://localhost:4000"})
@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping
    public ResponseEntity<?> addContact(@RequestBody AddContactRequest request) {
        try {
            ContactResponse response = contactService.addContact(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/technician/{ownerId}")
    public List<ContactResponse> getTechnicianContacts(@PathVariable UUID ownerId) {
        return contactService.getContactsByTechnician(ownerId);
    }

    @GetMapping("/farmer/{userId}")
    public List<ContactResponse> getFarmerContacts(@PathVariable UUID userId) {
        return contactService.getContactsByFarmer(userId);
    }

    @DeleteMapping("/{ownerId}/{contactId}")
    public ResponseEntity<?> deleteContact(
            @PathVariable UUID ownerId,
            @PathVariable UUID contactId
    ) {
        try {
            contactService.deleteContact(ownerId, contactId);
            return ResponseEntity.ok(Map.of("message", "Contact deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
