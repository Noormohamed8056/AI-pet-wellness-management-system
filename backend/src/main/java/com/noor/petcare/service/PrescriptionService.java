package com.noor.petcare.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.noor.petcare.model.MedicalRecord;
import com.noor.petcare.model.Prescription;
import com.noor.petcare.repository.MedicalRecordRepo;
import com.noor.petcare.repository.PrescriptionRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepo prescriptionRepo;
    private final MedicalRecordRepo medicalRecordRepo;

    public Prescription add(Long recordId, Prescription p) {

        MedicalRecord record = medicalRecordRepo.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Medical record not found"));

        p.setMedicalRecord(record);
        return prescriptionRepo.save(p);
    }

    public void delete(Long id) {

        Prescription p = prescriptionRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found"));
        prescriptionRepo.deleteById(p.getId());
    }
    
    public List<Prescription> getByMedicalRecord(Long recordId) {
    return prescriptionRepo.findByMedicalRecordId(recordId); 
   }

   public Prescription update(Long id, Prescription updated) {

    Prescription p = prescriptionRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Prescription not found"));

    if (updated.getMedicineName() != null)
        p.setMedicineName(updated.getMedicineName());

    if (updated.getDosage() != null)
        p.setDosage(updated.getDosage());

    if (updated.getDuration() != null)
        p.setDuration(updated.getDuration());

    if (updated.getInstructions() != null)
        p.setInstructions(updated.getInstructions());

    return prescriptionRepo.save(p);
}

public Prescription get(Long id) {

    return prescriptionRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Prescription not found"));
}

public List<Prescription> getByPet(Long petId) {
    return prescriptionRepo.findByMedicalRecordPetId(petId);
}

    public long getTotalPrescriptions(Long vetId) {
        return prescriptionRepo.countByMedicalRecord_Vet_Id(vetId);
    }
}
