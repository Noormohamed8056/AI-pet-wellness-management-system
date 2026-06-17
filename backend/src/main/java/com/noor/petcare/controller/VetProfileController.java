package com.jeeva.petcare.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

import com.jeeva.petcare.model.VetProfile;
import com.jeeva.petcare.service.VetProfileService;

@RestController
@RequestMapping("/vets/profile")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
@RequiredArgsConstructor
public class VetProfileController {

    private final VetProfileService vetProfileService;
    // ================= POST PROFILE (JSON) =================

    @PostMapping("/{userId}")
    public ResponseEntity<?> saveProfile(
            @PathVariable Long userId,
            @RequestBody VetProfile profile) {

        try {
            return ResponseEntity.ok(
                    vetProfileService.createOrUpdateProfile(userId, profile)
            );
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    // ================= PUT DOCUMENTS (multipart) =================
  @PutMapping(
    value = "/{userId}/documents",
    consumes = MediaType.MULTIPART_FORM_DATA_VALUE
)
public ResponseEntity<?> uploadDocuments(
        @PathVariable Long userId,

        @RequestPart(value = "degreeCertificate", required = false)
        MultipartFile degreeCertificate,

        @RequestPart(value = "medicalRegistrationCertificate", required = false)
        MultipartFile medicalRegistrationCertificate,

        @RequestPart(value = "identityProof", required = false)
        MultipartFile identityProof) {

    try {
        vetProfileService.uploadDocuments(
                userId,
                degreeCertificate,
                medicalRegistrationCertificate,
                identityProof
        );

        return ResponseEntity.ok("Documents uploaded successfully");

    } catch (RuntimeException e) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage());
    }
}


    // ================= GET =================
    @GetMapping("/{userId}")
    public ResponseEntity<?> get(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(vetProfileService.getByUser(userId));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    // ================= DELETE =================
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> delete(@PathVariable Long userId) {
        try {
            vetProfileService.delete(userId);
            return ResponseEntity.ok("Vet profile deleted");
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }
}
