package com.noor.petcare.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.noor.petcare.model.Pet;

public interface PetRepo extends JpaRepository<Pet, Long> {

    List<Pet> findByOwnerId(Long ownerId);

    // ✅ ADD THESE METHODS FOR CHATBOT
    long countByOwnerId(Long ownerId);
    
    @Query("SELECT COUNT(p) FROM Pet p")
    long countTotalPets();
    
    @Query("SELECT DISTINCT p FROM Pet p JOIN Appointment a ON a.pet.id = p.id WHERE a.vet.id = :vetId")
    List<Pet> findDistinctByAppointmentsVetId(Long vetId);
    
    @Query("SELECT COUNT(DISTINCT p) FROM Pet p JOIN Appointment a ON a.pet.id = p.id WHERE a.vet.id = :vetId")
    long countDistinctByAppointmentsVetId(Long vetId);
    
    @Query("SELECT p FROM Pet p WHERE p.owner.id = :ownerId ORDER BY p.name ASC")
    List<Pet> findByOwnerIdOrderByNameAsc(Long ownerId);
}
