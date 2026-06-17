package com.jeeva.petcare.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;

import com.jeeva.petcare.model.UserProfile;
import com.jeeva.petcare.service.UserProfileService;

@RestController
@RequestMapping("/users/profile")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService profileService;

    // CREATE or UPDATE
    @PostMapping("/{userId}")
    public ResponseEntity<?> save(@PathVariable Long userId, @RequestBody UserProfile profile) {
        try {
            return ResponseEntity.ok(profileService.createOrUpdate(userId, profile));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET one
    @GetMapping("/{userId}")
    public ResponseEntity<?> get(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(profileService.getByUser(userId));
        } catch (RuntimeException e) {
             return new ResponseEntity<>( e.getMessage(),HttpStatus.NOT_FOUND);
        }
    }

    // GET all owner profiles
    @GetMapping
    public List<UserProfile> getAll() {
        return profileService.getAllProfiles();
    }

    // DELETE
    @DeleteMapping("/{userId}")
    public ResponseEntity<?> delete(@PathVariable Long userId) {
        try {
            profileService.delete(userId);
            return ResponseEntity.ok("User profile deleted");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    //PUT
    @PutMapping("/{userId}")
    public ResponseEntity<?> update(@PathVariable Long userId, @RequestBody UserProfile profile) {
        try {
            return ResponseEntity.ok(profileService.createOrUpdate(userId, profile));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}
