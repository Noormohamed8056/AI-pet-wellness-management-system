package com.noor.petcare.dto;

import java.time.LocalDate;

import com.noor.petcare.model.HealthMetric.RecordedBy;

public record VetHealthMetricDTO(

        Long id,
        LocalDate date,

        Double weight,
        Double temperature,
        Integer pulse,
        Integer respirationRate,

        Integer stressLevel,
        Integer activityLevel,
        Integer appetiteLevel,
        Double sleepHours,

        String notes,
        RecordedBy recordedBy,

        // 👇 pet info (THIS is why DTO exists)
        Long petId,
        String petName,
        String petSpecies
) {}
