package com.jeeva.petcare.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.jeeva.petcare.model.VetProfile;

public interface VetProfileRepo extends JpaRepository<VetProfile, Long> {
    Optional<VetProfile> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
    // ✅ ADD THESE METHODS FOR CHATBOT
    
    @Query("SELECT COUNT(v) FROM VetProfile v WHERE v.user.approved = true")
    long countApprovedVetProfiles();
    
    @Query("SELECT AVG(v.experienceYears) FROM VetProfile v WHERE v.user.approved = true")
    Double averageVetExperience();
    
    @Query("SELECT v.specialization, COUNT(v) FROM VetProfile v GROUP BY v.specialization")
    List<Object[]> countBySpecialization();
}
