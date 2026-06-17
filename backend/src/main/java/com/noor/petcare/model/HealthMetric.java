//HealthMetric.java
package com.jeeva.petcare.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HealthMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_id", nullable = false)
    @JsonIgnore
    private Pet pet;

    // ---- Date info ----
    private LocalDate date;
    private LocalDateTime createdAt = LocalDateTime.now();

    // ---- Vital signs ----
    private Double weight;              // kg
    private Double temperature;         // °C
    private Integer pulse;              // BPM
    private Integer respirationRate;    // breaths/min

    // ---- Daily health indicators ----
    private Integer stressLevel;        // 1–10
    private Integer activityLevel;      // 1–10
    private Integer appetiteLevel;      // 1–10
    private Double sleepHours;           // hours

    // ---- Notes ----
    private String notes;

    @Enumerated(EnumType.STRING)
    private RecordedBy recordedBy;

    public enum RecordedBy {
        OWNER,
        VET
    }

}
