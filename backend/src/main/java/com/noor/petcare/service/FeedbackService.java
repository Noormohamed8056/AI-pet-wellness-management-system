// FeedbackService.java
package com.jeeva.petcare.service;

import org.springframework.stereotype.Service;

import com.jeeva.petcare.model.*;
import com.jeeva.petcare.repository.*;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepo feedbackRepo;
    private final AppointmentRepo appointmentRepo;

    // CREATE feedback
    public Feedback create(Long appointmentId, Long userId, Feedback f) {

        Appointment appt = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appt.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can review only your appointment");
        }

        if (appt.getStatus() != Appointment.Status.COMPLETED) {
            throw new RuntimeException("Feedback allowed only after completion");
        }

        if (feedbackRepo.existsByAppointmentId(appointmentId)) {
            throw new RuntimeException("Feedback already submitted");
        }

        validateRating(f.getRating());
        validateRating(f.getWaitingTimeRating());
        validateRating(f.getFacilitiesRating());
        validateRating(f.getStaffFriendlinessRating());
        validateRating(f.getValueForMoneyRating());

        f.setAppointment(appt);
        f.setUser(appt.getUser());
        f.setVet(appt.getVet());

        return feedbackRepo.save(f);
    }

    // GET vet feedbacks
    public Object getVetFeedbacks(Long vetId) {
        return feedbackRepo.findByVetId(vetId);
    }

    // GET user feedbacks
    public Object getUserFeedbacks(Long userId) {
        return feedbackRepo.findByUserId(userId);
    }

    private void validateRating(Integer rating) {
        if (rating != null && (rating < 1 || rating > 5)) {
            throw new RuntimeException("Ratings must be between 1 and 5");
        }
    }

      public boolean existsByAppointment(Long appointmentId) {
        return feedbackRepo.existsByAppointmentId(appointmentId);
    }

    // 2️⃣ Get feedback for an appointment
    public Feedback getByAppointment(Long appointmentId) {
        return feedbackRepo.findByAppointmentId(appointmentId)
                .orElseThrow(() ->
                        new RuntimeException("Feedback not found for this appointment"));
    }
    
}
