package com.jeeva.petcare.model;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Vaccination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Pet (derived from appointment)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false)
    @JsonIgnore
    private Pet pet;

    // Vaccine name
    private String name;

    // Given date
    private LocalDate date;

    // Next due date
    private LocalDate nextDueDate;

    @Enumerated(EnumType.STRING)
    private VaccineType type;

    @Enumerated(EnumType.STRING)
    private VaccineStatus status;

    // Vet (derived from appointment)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vet_id", nullable = false)
  @JsonIgnoreProperties({
    "password",
    "verificationToken",
    "emailVerified",
    "pets",
    "userProfile",
    "email",
    "phone",
    "approved",
    "createdAt",
    "updatedAt",
    
})
    private User vet;


    // LOCK to appointment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    @JsonIgnore
    private Appointment appointment;

    public enum VaccineType {
        CORE,
        NON_CORE
    }

    public enum VaccineStatus {
        DONE,
        DUE,
        OVERDUE
    }
}
