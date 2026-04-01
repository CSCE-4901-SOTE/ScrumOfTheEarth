package com.sote.FarmRa.service;

import com.sote.FarmRa.model.dto.AddContactRequest;
import com.sote.FarmRa.model.dto.ContactResponse;
import com.sote.FarmRa.entity.Contact;
import com.sote.FarmRa.entity.User;
import com.sote.FarmRa.repository.ContactRepository;
import com.sote.FarmRa.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ContactService {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;

    public ContactService(ContactRepository contactRepository, UserRepository userRepository) {
        this.contactRepository = contactRepository;
        this.userRepository = userRepository;
    }

    public ContactResponse addContact(AddContactRequest request) {
        UUID ownerId = UUID.fromString(request.getOwnerId());

        User farmer = userRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("Email does not exist"));

        if (farmer.getRole() == null ||
            farmer.getRole().getName() == null ||
            !farmer.getRole().getName().equalsIgnoreCase("farmer")) {
            throw new RuntimeException("This email does not belong to a farmer");
        }

        boolean exists = contactRepository.existsByOwnerIdAndUserId(ownerId, farmer.getUserId());
        if (exists) {
            throw new RuntimeException("Contact already exists");
        }

        Contact contact = new Contact();
        contact.setOwnerId(ownerId);
        contact.setUserId(farmer.getUserId());

        Contact saved = contactRepository.save(contact);

        return new ContactResponse(
                saved.getUserId(),
                farmer.getFullName(),
                farmer.getPhone(),
                farmer.getEmail(),
                0
        );
    }

    public List<ContactResponse> getContactsByTechnician(UUID ownerId) {

        long start = System.currentTimeMillis();

        List<ContactResponse> result = contactRepository.findTechnicianContactResponses(ownerId);

        System.out.println("Technician contacts API took: "
                + (System.currentTimeMillis() - start) + " ms");

        return result;
    }

    public void deleteContact(UUID ownerId, UUID contactId) {
        Contact contact = contactRepository.findByIdAndOwnerId(contactId, ownerId)
                .orElseThrow(() -> new RuntimeException("Contact not found"));

        contactRepository.delete(contact);
    }

    public List<ContactResponse> getContactsByFarmer(UUID userId) {
        long start = System.currentTimeMillis();

        List<ContactResponse> result = contactRepository.findFarmerContactResponses(userId);

        System.out.println("Farmer contacts API took: "
                + (System.currentTimeMillis() - start) + " ms");

        return result;
    }
}
