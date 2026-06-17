package com.jeeva.petcare.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import com.jeeva.petcare.model.Appointment;
import com.jeeva.petcare.model.Pet;
import com.jeeva.petcare.model.User;
import com.jeeva.petcare.repository.AppointmentRepo;
import com.jeeva.petcare.repository.FeedbackRepo;
import com.jeeva.petcare.repository.HealthAlertRepo;
import com.jeeva.petcare.repository.HealthMetricRepo;
import com.jeeva.petcare.repository.MedicalRecordRepo;
import com.jeeva.petcare.repository.PaymentRepo;
import com.jeeva.petcare.repository.PetRepo;
import com.jeeva.petcare.repository.PrescriptionRepo;
import com.jeeva.petcare.repository.UserRepo;
import com.jeeva.petcare.repository.VaccinationRepository;

@Service
@RequiredArgsConstructor
public class PetService {

    private final PetRepo petRepo;
    private final UserRepo userRepo;
    private final AppointmentRepo appointmentRepo;
    private final VaccinationRepository vaccinationRepo;
    private final MedicalRecordRepo medicalRecordRepo;
    private final HealthAlertRepo healthAlertRepo;
    private final HealthMetricRepo healthMetricRepo;
    private final PrescriptionRepo prescriptionRepo;
    private final PaymentRepo paymentRepo;
    private final FeedbackRepo feedbackRepo;
    // CREATE
    public Pet createPet(Long userId, Pet pet) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        pet.setImageUrl(normalizeImageUrl(pet.getImageUrl()));
        pet.setOwner(user);
        return petRepo.save(pet);
    }

    // GET one
    public Pet getPet(Long petId) {
        return petRepo.findById(petId)
                .orElseThrow(() -> new RuntimeException("Pet not found"));
    }

    // GET all pets of a user
    public List<Pet> getUserPets(Long userId) {
        return petRepo.findByOwnerId(userId);
    }

    // GET all pets
    public List<Pet> getAllPets() {
    return petRepo.findAll();
    }

    // UPDATE
    public Pet updatePet(Long petId, Long userId, Pet newPet) {

        Pet pet = petRepo.findById(petId)
                .orElseThrow(() -> new RuntimeException("Pet not found"));

        if (!pet.getOwner().getId().equals(userId)) {
            throw new RuntimeException("You can update only your own pet");
        }

        if (newPet.getName() != null)
             pet.setName(newPet.getName());

        if (newPet.getSpecies() != null)
            pet.setSpecies(newPet.getSpecies());

        if (newPet.getBreed() != null)
            pet.setBreed(newPet.getBreed());

        if (newPet.getAge() != null)
            pet.setAge(newPet.getAge());

        if (newPet.getGender() != null)
            pet.setGender(newPet.getGender());

        if (newPet.getImageUrl() != null)
            pet.setImageUrl(normalizeImageUrl(newPet.getImageUrl()));

        return petRepo.save(pet);
    }

    private String normalizeImageUrl(String imageUrl) {
        if (imageUrl == null) {
            return null;
        }

        String trimmed = imageUrl.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        if (trimmed.length() > 2048) {
            throw new RuntimeException("Image URL is too long. Please use a shorter direct image link.");
        }

        return trimmed;
    }

    // DELETE
    @Transactional
    public void deletePet(Long petId, Long userId) {

        Pet pet = petRepo.findById(petId)
                .orElseThrow(() -> new RuntimeException("Pet not found"));

        if (!pet.getOwner().getId().equals(userId)) {
            throw new RuntimeException("You can delete only your own pet");
        }
        prescriptionRepo.deleteByPetId(petId);
        medicalRecordRepo.deleteByPetId(petId);
        paymentRepo.deleteByPetId(petId);
        vaccinationRepo.deleteByPetId(petId);
        feedbackRepo.deleteByPetId(petId); 
        appointmentRepo.deleteByPetId(petId);
        healthMetricRepo.deleteByPetId(petId);
        healthAlertRepo.deleteByPetId(petId);
        petRepo.delete(pet);
    }

    public List<Pet> getPatientsByVet(Long vetId) {
    return appointmentRepo.findDistinctPetsByVetAndStatus(
        vetId, Appointment.Status.COMPLETED
    );
}

public Map<String, Object> getSummary(Long vetId, Long petId) {

    Map<String, Object> map = new HashMap<>();

    map.put("totalVisits",
        appointmentRepo.countByVetIdAndPetIdAndStatus(
            vetId, petId, Appointment.Status.COMPLETED
        ));

    map.put("totalVaccinations",
        vaccinationRepo.countByPetId(petId));

    String lastDiagnosis =
    medicalRecordRepo.findLatestDiagnosisRaw(vetId, petId)
        .stream()
        .findFirst()
        .orElse(null);

    map.put("lastDiagnosis", lastDiagnosis);

     // ✅ NEW: last appointment date
    map.put("lastVisit",
        appointmentRepo.findLastVisitDate(
            vetId, petId, Appointment.Status.COMPLETED
        )
    );

    return map;
}


}
