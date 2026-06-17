package com.jeeva.petcare.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.jeeva.petcare.model.*;
import com.jeeva.petcare.model.Vaccination.VaccineStatus;
import com.jeeva.petcare.repository.*;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VaccinationService {

    private final VaccinationRepository vaccinationRepo;
    private final AppointmentRepo appointmentRepo;

    private void calculateStatus(Vaccination v) {

        LocalDate today = LocalDate.now();

        if (v.getDate() != null && !v.getDate().isAfter(today)) {
            v.setStatus(VaccineStatus.DONE);
        }
        else if (v.getNextDueDate() != null &&
                 v.getNextDueDate().isBefore(today)) {
            v.setStatus(VaccineStatus.OVERDUE);
        }
        else {
            v.setStatus(VaccineStatus.DUE);
        }
    }

    // CREATE (STRICTLY FROM APPROVED APPOINTMENT)
    public Vaccination createFromAppointment(
            Long appointmentId,
            Long vetId,
            Vaccination vaccination) {

        Appointment appt = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (appt.getStatus() != Appointment.Status.APPROVED) {
            throw new RuntimeException("Appointment not approved");
        }

        if (!appt.getVet().getId().equals(vetId)) {
            throw new RuntimeException("You can add vaccination only for your appointment");
        }

        vaccination.setAppointment(appt);
        vaccination.setPet(appt.getPet());
        vaccination.setVet(appt.getVet());

        calculateStatus(vaccination);

        return vaccinationRepo.save(vaccination);
    }

    // GET one
    public Vaccination get(Long id) {
        return vaccinationRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Vaccination not found"));
    }

    // GET all for pet
    public List<Vaccination> getPetVaccinations(Long petId) {
        return vaccinationRepo.findByPetId(petId);
    }

    // GET all by vet
    public List<Vaccination> getVetVaccinations(Long vetId) {
        return vaccinationRepo.findByVetId(vetId);
    }

    // UPDATE
    public Vaccination update(Long id, Vaccination updated) {

        Vaccination v = get(id);

        if (updated.getName() != null)
            v.setName(updated.getName());

        if (updated.getDate() != null)
            v.setDate(updated.getDate());

        if (updated.getNextDueDate() != null)
            v.setNextDueDate(updated.getNextDueDate());

        if (updated.getType() != null)
            v.setType(updated.getType());

        calculateStatus(v);

        return vaccinationRepo.save(v);
    }

    // DELETE
    public void delete(Long id) {
        vaccinationRepo.delete(get(id));
    }

    public List<Vaccination> getByAppointment(Long appointmentId) {

        return vaccinationRepo.findByAppointmentId(appointmentId);
    }

}
