package com.jeeva.petcare.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import com.jeeva.petcare.model.*;
import com.jeeva.petcare.repository.*;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepo appointmentRepo;
    private final UserRepo userRepo;
    private final PetRepo petRepo;
    private final VetSlotRepo vetSlotRepo;
    private final MedicalRecordRepo medicalRecordRepo;
    private final VaccinationRepository vaccinationRepo;
    private final PrescriptionRepo prescriptionRepo;
    private final JavaMailSender mailSender;

    // CREATE appointment
    public Appointment book(Long userId, Long petId, Long slotId) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Pet pet = petRepo.findById(petId)
                .orElseThrow(() -> new RuntimeException("Pet not found"));

        VetSlot slot = vetSlotRepo.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        if (!slot.isAvailable()) {
            throw new RuntimeException("Slot already booked");
        }

        Appointment appt = new Appointment();
        appt.setUser(user);
        appt.setPet(pet);
        appt.setVet(slot.getVet());
        appt.setSlot(slot);
        appt.setStatus(Appointment.Status.BOOKED);

        slot.setAvailable(false);

        return appointmentRepo.save(appt);
    }
    
    public List<Appointment> getAllAppointments() {
    return appointmentRepo.findAll();
}


    public Appointment markPaid(Long appointmentId) {

        Appointment appt = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        appt.setStatus(Appointment.Status.PAID);
        return appointmentRepo.save(appt);
    }
    @Transactional
    public Appointment approveAppointment(Long appointmentId, Long vetId) {

    Appointment appt = appointmentRepo.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

    if (!appt.getVet().getId().equals(vetId)) {
        throw new RuntimeException("You can approve only your appointments");
    }

    if (appt.getStatus() != Appointment.Status.PAID) {
        throw new RuntimeException("Appointment not paid yet");
    }

    appt.setStatus(Appointment.Status.APPROVED);
    Appointment saved = appointmentRepo.save(appt);

        // ✅ SEND ACCEPTANCE EMAIL (non-blocking)
        try {
            sendVetAcceptedEmail(saved);
        } catch (Exception e) {
            System.out.println("Vet acceptance email failed: " + e.getMessage());
        }

        return saved;
    }
    private void sendVetAcceptedEmail(Appointment appt) {

    SimpleMailMessage mail = new SimpleMailMessage();
    mail.setTo(appt.getUser().getEmail());
    mail.setSubject("Vet Accepted Your Appointment 🐾");

    mail.setText("""
        Hi %s,

        Good news 🎉  
        Dr. %s has accepted your appointment request.

        🐶 Pet: %s
        📅 Date: %s
        ⏰ Time: %s

        Please make sure to arrive on time.
        We’re excited to take care of your pet ❤️

        – Smart Pet Care
        """.formatted(
            appt.getUser().getName(),
            appt.getVet().getName(),
            appt.getPet().getName(),
            appt.getSlot().getSlotDate(),
            appt.getSlot().getStartTime()
        ));

    mailSender.send(mail);
}


    @Transactional
    public Appointment cancel(Long appointmentId, Long userId) {

        Appointment appt = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

            if (!appt.getUser().getId().equals(userId)) {
                throw new RuntimeException("You can cancel only your appointment");
            }

            if (appt.getStatus() == Appointment.Status.COMPLETED) {
                throw new RuntimeException("Completed appointment cannot be cancelled");
            }

        appt.setStatus(Appointment.Status.CANCELLED);
        
        VetSlot slot = appt.getSlot();
        slot.setAvailable(true);
        appt.setSlot(null);
        return appointmentRepo.save(appt);
    }

@Transactional
public Appointment rejectAppointment(Long appointmentId, Long vetId) {

    Appointment appt = appointmentRepo.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

    if (!appt.getVet().getId().equals(vetId)) {
        throw new RuntimeException("Unauthorized vet");
    }

    if (appt.getStatus() == Appointment.Status.COMPLETED ||
        appt.getStatus() == Appointment.Status.CANCELLED) {
        throw new RuntimeException("Cannot reject this appointment");
    }

    appt.setStatus(Appointment.Status.REJECTED);
    VetSlot slot = appt.getSlot();
    slot.setAvailable(true);
    appt.setSlot(null);
    Appointment saved = appointmentRepo.save(appt);

        // ✅ SEND REJECTION EMAIL (non-blocking)
        try {
            sendVetRejectedEmail(saved);
        } catch (Exception e) {
            System.out.println("Vet rejection email failed: " + e.getMessage());
        }

        return saved;
 }
    private void sendVetRejectedEmail(Appointment appt) {

        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(appt.getUser().getEmail());
        mail.setSubject("Appointment Update ❌");

        mail.setText("""
            Hi %s,

            Unfortunately, Dr. %s is unable to take your appointment at this time.

            🐶 Pet: %s

            Don’t worry ❤️  
            You can easily:
            • Choose another vet
            • Select a different time slot

            We’re here to help your pet stay healthy 🐾

            – Smart Pet Care
            """.formatted(
                appt.getUser().getName(),
                appt.getVet().getName(),
                appt.getPet().getName()
            ));

        mailSender.send(mail);
    }


    @Transactional
    public Appointment reschedule(Long appointmentId, Long userId, Long newSlotId) {

        Appointment appt = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (!appt.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can reschedule only your appointment");
        }

        if (appt.getStatus() == Appointment.Status.COMPLETED) {
            throw new RuntimeException("Completed appointment cannot be rescheduled");
        }

        VetSlot newSlot = vetSlotRepo.findById(newSlotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        if (!newSlot.isAvailable()) {
            throw new RuntimeException("Selected slot not available");
        }

        // release old slot safely
    if (appt.getSlot() != null) {
        appt.getSlot().setAvailable(true);
    }

        // assign new slot
        appt.setSlot(newSlot);
        newSlot.setAvailable(false);

        return appointmentRepo.save(appt);
    }

    public List<Appointment> getUserUpcoming(Long userId) {

    return appointmentRepo.findByUserIdAndStatusIn(
            userId,
            List.of(
                Appointment.Status.BOOKED,
                Appointment.Status.PAID,
                Appointment.Status.APPROVED
            )
    );
}

public List<Appointment> getUserCompleted(Long userId) {

    return appointmentRepo.findByUserIdAndStatusIn(
            userId,
            List.of(Appointment.Status.COMPLETED)
    );
}

public List<Appointment> getVetUpcoming(Long vetId) {

    return appointmentRepo.findByVetIdAndStatusIn(
            vetId,
            List.of(
                Appointment.Status.PAID,
                Appointment.Status.APPROVED
            )
    );
}

public List<Appointment> getVetCompleted(Long vetId) {

    return appointmentRepo.findByVetIdAndStatusIn(
            vetId,
            List.of(Appointment.Status.COMPLETED)
    );
}

@Transactional
public Appointment complete(Long appointmentId, Long vetId) {

    Appointment appt = appointmentRepo.findById(appointmentId)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));

    if (!appt.getVet().getId().equals(vetId)) {
        throw new RuntimeException("Unauthorized vet");
    }

    if (appt.getStatus() != Appointment.Status.APPROVED) {
        throw new RuntimeException("Appointment not in progress");
    }

    // Ensure medical record exists
    if (!medicalRecordRepo.existsByAppointmentId(appointmentId)) {
        throw new RuntimeException("Medical record missing");
    }

    // Ensure at least one prescription OR vaccination exists
    boolean hasPrescription =
            prescriptionRepo.existsByMedicalRecordAppointmentId(appointmentId);

    boolean hasVaccination =
            vaccinationRepo.existsByAppointmentId(appointmentId);

    if (!hasPrescription && !hasVaccination) {
        throw new RuntimeException(
            "Add prescription or vaccination before completing appointment");
    }

    appt.setStatus(Appointment.Status.COMPLETED);
    Appointment saved = appointmentRepo.save(appt);

    // ✅ SEND COMPLETION EMAIL
    try {
        sendAppointmentCompletedEmail(saved);
    } catch (Exception e) {
        System.out.println("Completion email failed: " + e.getMessage());
    }

    return saved;
}
private void sendAppointmentCompletedEmail(Appointment appt) {

    SimpleMailMessage mail = new SimpleMailMessage();
    mail.setTo(appt.getUser().getEmail());
    mail.setSubject("Appointment Completed ✅");

    mail.setText("""
        Hi %s,

        Your appointment with Dr. %s has been successfully completed 🩺

        We hope %s is feeling better already 🐾

        👉 You can now:
        • View medical records
        • Check prescriptions
        • Explore our pet marketplace

        Wishing your pet a healthy life ❤️

        – Smart Pet Care
        """.formatted(
            appt.getUser().getName(),
            appt.getVet().getName(),
            appt.getPet().getName()
        ));

    mailSender.send(mail);
}


public List<Appointment> getVetPaidAppointments(Long vetId) {
    return appointmentRepo.findByVet_IdAndStatus(
        vetId,
        Appointment.Status.PAID
    );
}

public List<Appointment> getCompletedVisits(Long vetId, Long petId) {
    return appointmentRepo.findByVetIdAndPetIdAndStatus(
        vetId, petId, Appointment.Status.COMPLETED
    );
}

public long getAppointmentCountByPet(Long petId) {
    return appointmentRepo.countByPetId(petId);
}

public Map<String, Object> getStats() {

    List<Appointment> all = appointmentRepo.findAll();

    Map<String, Object> stats = new HashMap<>();

    stats.put("total", all.size());
    stats.put("booked",
            all.stream().filter(a -> a.getStatus() == Appointment.Status.BOOKED).count());
    stats.put("approved",
            all.stream().filter(a -> a.getStatus() == Appointment.Status.APPROVED).count());
    stats.put("completed",
            all.stream().filter(a -> a.getStatus() == Appointment.Status.COMPLETED).count());
    stats.put("cancelled",
            all.stream().filter(a ->
                    a.getStatus() == Appointment.Status.CANCELLED ||
                    a.getStatus() == Appointment.Status.REJECTED).count());

    return stats;
}
public List<Appointment> getByDateRange(String start, String end) {

    LocalDateTime startDate =
            LocalDate.parse(start).atStartOfDay();

    LocalDateTime endDate =
            LocalDate.parse(end).atTime(23, 59, 59);

    return appointmentRepo
            .findByCreatedAtBetween(startDate, endDate);
}
public List<Appointment> getByStatus(String status) {

    Appointment.Status enumStatus =
            Appointment.Status.valueOf(status.toUpperCase());

    return appointmentRepo.findByStatus(enumStatus);
}
public Appointment getById(Long id) {
    return appointmentRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Appointment not found"));
}


}
