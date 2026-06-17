package com.jeeva.petcare.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.jeeva.petcare.model.HealthAlert;
import com.jeeva.petcare.model.HealthMetric;
import com.jeeva.petcare.repository.HealthAlertRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HealthAlertService {

    private final HealthAlertRepo alertRepo;

    // GET all alerts of a pet
    public List<HealthAlert> getAlertsByPet(Long petId) {
        return alertRepo.findByPetId(petId);
    }

    // GET only active alerts
    public List<HealthAlert> getActiveAlerts(Long petId) {
        return alertRepo.findByPetIdAndResolvedFalse(petId);
    }

    // GET single alert
    public HealthAlert getAlert(Long alertId) {
        return alertRepo.findById(alertId)
                .orElseThrow(() -> new RuntimeException("Health alert not found"));
    }

    // CREATE alert (used internally from HealthMetricService)
    public void createAlert(
        HealthMetric m,
        String type,
        String message,
        String severity) {

    boolean alreadyExists =
        alertRepo.existsByPetIdAndAlertTypeAndResolvedFalse(
            m.getPet().getId(), type);

    if (alreadyExists) return;

    HealthAlert alert = new HealthAlert();
    alert.setPet(m.getPet());
    alert.setAlertType(type);
    alert.setMessage(message);
    alert.setSeverity(severity);

    alertRepo.save(alert);
}


    // RESOLVE alert
    public HealthAlert resolveAlert(Long alertId) {
        HealthAlert alert = getAlert(alertId);
        alert.setResolved(true);
        return alertRepo.save(alert);
    }

    // DELETE alert
    public void deleteAlert(Long alertId) {
        HealthAlert alert = getAlert(alertId);
        alertRepo.delete(alert);
    }
}
