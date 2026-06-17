//HealthAlert.java
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
public class HealthAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many alerts → One pet
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false)
    @JsonIgnore
    private Pet pet;

    private String alertType;   // FEVER, HEART_RATE, STRESS, APPETITE
    private String message;

    private String severity;    // LOW, MEDIUM, HIGH

    private boolean resolved = false;

    private LocalDateTime createdAt = LocalDateTime.now();
}
