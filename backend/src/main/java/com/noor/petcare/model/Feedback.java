// Feedback.java
package com.jeeva.petcare.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One feedback per appointment
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false, unique = true)
    @JsonIgnore
    private Appointment appointment;

    // Who gave feedback
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    // Which vet
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vet_id", nullable = false)
    @JsonIgnore
    private User vet;

    private Integer rating; // 1–5
    private String comment;

    private Integer waitingTimeRating;
    private Integer facilitiesRating;
    private Integer staffFriendlinessRating;
    private Integer valueForMoneyRating;

    private LocalDateTime createdAt = LocalDateTime.now();
}
