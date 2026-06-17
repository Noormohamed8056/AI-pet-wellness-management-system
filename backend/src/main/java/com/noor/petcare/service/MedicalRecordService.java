package com.jeeva.petcare.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.jeeva.petcare.model.Appointment;
import com.jeeva.petcare.model.MedicalRecord;
import com.jeeva.petcare.repository.AppointmentRepo;
import com.jeeva.petcare.repository.MedicalRecordRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepo medicalRecordRepo;
    private final AppointmentRepo appointmentRepo;

    public MedicalRecord create(Long appointmentId, MedicalRecord record) {

        Appointment appt = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (appt.getStatus() != Appointment.Status.APPROVED) {
            throw new RuntimeException("Appointment not approved");
        }

        if (medicalRecordRepo.existsByAppointmentId(appointmentId)) {
            throw new RuntimeException("Medical record already exists");
        }

        record.setAppointment(appt);
        record.setVet(appt.getVet());
        record.setPet(appt.getPet());

        MedicalRecord saved = medicalRecordRepo.save(record);
        appointmentRepo.save(appt);

        return saved;
    }

    public MedicalRecord get(Long id) {
        return medicalRecordRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Medical record not found"));
    }

    public MedicalRecord getByAppointment(Long appointmentId) {
    return medicalRecordRepo.findByAppointmentId(appointmentId)
            .orElseThrow(() ->
                new RuntimeException("Medical record not found for this appointment"));
    }
    public List<MedicalRecord> getAllByPet(Long petId) {

    List<MedicalRecord> records = medicalRecordRepo.findByPetId(petId);

    if (records.isEmpty()) {
        throw new RuntimeException("No medical records found for this pet");
    }

    return records;
}


    public MedicalRecord update(Long recordId, MedicalRecord updated) 
  {

    MedicalRecord record = medicalRecordRepo.findById(recordId)
            .orElseThrow(() -> new RuntimeException("Medical record not found"));

    if (updated.getDiagnosis() != null)
        record.setDiagnosis(updated.getDiagnosis());

    if (updated.getNotes() != null)
        record.setNotes(updated.getNotes());

    return medicalRecordRepo.save(record); 
  }
  

}
