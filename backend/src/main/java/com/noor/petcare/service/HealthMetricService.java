package com.jeeva.petcare.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.jeeva.petcare.dto.VetHealthMetricDTO;
import com.jeeva.petcare.model.Appointment;
import com.jeeva.petcare.model.HealthMetric;
import com.jeeva.petcare.model.Pet;
import com.jeeva.petcare.repository.AppointmentRepo;
import com.jeeva.petcare.repository.HealthMetricRepo;
import com.jeeva.petcare.repository.PetRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HealthMetricService {

    private final HealthMetricRepo metricRepo;
    private final PetRepo petRepo;
    private final HealthAlertService alertService;
    private final AppointmentRepo appointmentRepo;
    // CREATE
    // 🐾 OWNER version (restricted)
    public HealthMetric addMetricByOwner(Long petId, HealthMetric metric) {

        // Owner cannot set clinical vitals
        metric.setTemperature(null);
        metric.setPulse(null);
        metric.setRespirationRate(null);

        metric.setRecordedBy(HealthMetric.RecordedBy.OWNER);

        return addMetricInternal(petId, metric);
    }

    // 🩺 VET version (full access)
    public HealthMetric addMetricByVet(Long petId, HealthMetric metric) {

        metric.setRecordedBy(HealthMetric.RecordedBy.VET);

        return addMetricInternal(petId, metric);
    }

    // 🔁 Shared internal logic
    private HealthMetric addMetricInternal(Long petId, HealthMetric metric) {

        Pet pet = petRepo.findById(petId)
                .orElseThrow(() -> new RuntimeException("Pet not found"));

        metric.setPet(pet);

        if (metric.getDate() == null) {
            metric.setDate(LocalDate.now());
        }

        HealthMetric saved = metricRepo.save(metric);

        // 🚨 Generate alerts if needed
        generateAlerts(metric);

        return saved;
    }

    private void generateAlerts(HealthMetric m) {

        if (m.getTemperature() != null && m.getTemperature() > 39.5) {
            alertService.createAlert(m, "FEVER", "High fever detected", "HIGH");
        }

        if (m.getPulse() != null && m.getPulse() > 140) {
            alertService.createAlert(m, "HEART_RATE", "High heart rate detected", "HIGH");
        }

        if (m.getRespirationRate() != null && m.getRespirationRate() > 40) {
            alertService.createAlert(m, "RESPIRATION", "Abnormal breathing rate", "MEDIUM");
        }

        if (m.getAppetiteLevel() != null && m.getAppetiteLevel() <= 3) {
            alertService.createAlert(m, "APPETITE", "Low appetite observed", "MEDIUM");
        }

        if (m.getSleepHours() != null && m.getSleepHours() < 5) {
            alertService.createAlert(m, "SLEEP", "Insufficient sleep detected", "LOW");
        }
    }


    // GET single
    public HealthMetric getMetric(Long id) {
        return metricRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Health metric not found"));
    }

    // GET all metrics of a pet
    public List<HealthMetric> getPetMetrics(Long petId) {
        return metricRepo.findByPetIdOrderByDateDesc(petId);
    }

    // GET metrics by date
    public List<HealthMetric> getMetricsByDate(Long petId, LocalDate date) {
        return metricRepo.findByPetIdAndDate(petId, date);
    }

    // UPDATE (partial update)
    public HealthMetric updateMetric(Long id, HealthMetric updated) {

        HealthMetric metric = getMetric(id);

        if (updated.getWeight() != null)
            metric.setWeight(updated.getWeight());

        if (updated.getTemperature() != null)
            metric.setTemperature(updated.getTemperature());

        if (updated.getPulse() != null)
            metric.setPulse(updated.getPulse());

        if (updated.getRespirationRate() != null)
            metric.setRespirationRate(updated.getRespirationRate());

        if (updated.getStressLevel() != null)
            metric.setStressLevel(updated.getStressLevel());

        if (updated.getActivityLevel() != null)
            metric.setActivityLevel(updated.getActivityLevel());

        if (updated.getAppetiteLevel() != null)
            metric.setAppetiteLevel(updated.getAppetiteLevel());

        if (updated.getSleepHours() != null)
            metric.setSleepHours(updated.getSleepHours());

        if (updated.getNotes() != null)
            metric.setNotes(updated.getNotes());

        HealthMetric saved = metricRepo.save(metric);

        // 🚨 ALERTS CREATED HERE
        generateAlerts(saved);

        return saved;
    }

    // DELETE
    public void deleteMetric(Long id) {
        HealthMetric metric = getMetric(id);
        metricRepo.delete(metric);
    }
public List<VetHealthMetricDTO> getVetPetsMetrics(Long vetId) {

    List<Appointment> appointments =
            appointmentRepo.findByVetIdAndStatusIn(
                    vetId,
                    List.of(
                        Appointment.Status.APPROVED,
                        Appointment.Status.COMPLETED
                    )
            );

    if (appointments.isEmpty()) {
        return List.of();
    }

    return appointments.stream()
            .map(Appointment::getPet)
            .distinct()
            .flatMap(pet ->
                    metricRepo
                        .findByPetIdOrderByDateDesc(pet.getId())
                        .stream()
                        .map(m -> new VetHealthMetricDTO(
                                m.getId(),
                                m.getDate(),
                                m.getWeight(),
                                m.getTemperature(),
                                m.getPulse(),
                                m.getRespirationRate(),
                                m.getStressLevel(),
                                m.getActivityLevel(),
                                m.getAppetiteLevel(),
                                m.getSleepHours(),
                                m.getNotes(),
                                m.getRecordedBy(),
                                pet.getId(),
                                pet.getName(),
                                pet.getSpecies()
                        ))
            )
            .toList();
}

}
