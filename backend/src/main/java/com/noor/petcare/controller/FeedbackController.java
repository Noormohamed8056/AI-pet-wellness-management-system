// FeedbackController.java
package com.noor.petcare.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.noor.petcare.model.Feedback;
import com.noor.petcare.service.FeedbackService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/feedbacks")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    // CREATE feedback
    @PostMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> create(
            @PathVariable Long appointmentId,
            @RequestParam Long userId,
            @RequestBody Feedback feedback) {

        try {
            return ResponseEntity.ok(
                    feedbackService.create(appointmentId, userId, feedback));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET feedbacks for vet
    @GetMapping("/vet/{vetId}")
    public ResponseEntity<?> getVetFeedbacks(@PathVariable Long vetId) {
        return ResponseEntity.ok(
                feedbackService.getVetFeedbacks(vetId));
    }

    // GET feedbacks by user
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserFeedbacks(@PathVariable Long userId) {
        return ResponseEntity.ok(
                feedbackService.getUserFeedbacks(userId));
    }

    // 1️⃣ Check if feedback already exists (UX helper)
    @GetMapping("/appointment/{appointmentId}/exists")
    public ResponseEntity<?> exists(@PathVariable Long appointmentId) {
        try {
            return ResponseEntity.ok(
                    feedbackService.existsByAppointment(appointmentId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 2️⃣ Get feedback for an appointment
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> getByAppointment(@PathVariable Long appointmentId) {
        try {
            return ResponseEntity.ok(
                    feedbackService.getByAppointment(appointmentId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
}
