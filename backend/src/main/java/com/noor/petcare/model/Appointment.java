package com.jeeva.petcare.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({
        "password",
        "verificationToken",
        "emailVerified",
        "pets",
        "vetProfile",
        "userProfile"
    })
    private User user;



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false)
    @JsonIgnoreProperties({
        "owner",
        "healthMetrics",
        "vaccinations"
    })
    private Pet pet;


    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnoreProperties({
        "password",
        "emailVerified",
        "verificationToken",
        "pets",
        "userProfile",
        "email",
        "phone"
    })
    private User vet;


    @OneToOne
    @JoinColumn(name = "slot_id", unique = true)
    private VetSlot slot;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToOne(mappedBy = "appointment", cascade = CascadeType.ALL)
    @JsonIgnore
    private Payment payment;

@OneToOne(mappedBy = "appointment", fetch = FetchType.LAZY)
@JsonIgnoreProperties({
    "appointment",
    "vet",
    "pet"
})
private MedicalRecord medicalRecord;


    public enum Status {
        BOOKED,
        PAID,
        APPROVED,
        COMPLETED,
        CANCELLED,
        REJECTED
    }
}