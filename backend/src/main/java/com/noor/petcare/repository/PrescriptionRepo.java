package com.jeeva.petcare.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jeeva.petcare.model.Prescription;

public interface PrescriptionRepo extends JpaRepository<Prescription, Long> {
    List<Prescription> findByMedicalRecordId(Long medicalRecordId);
    List<Prescription> findByMedicalRecordPetId(Long petId);
    boolean existsByMedicalRecordAppointmentId(Long appointmentId);
     long countByMedicalRecord_Vet_Id(Long vetId);

            @Modifying
        @Query("""
        DELETE FROM Prescription p
        WHERE p.medicalRecord.pet.id = :petId
        """)
        void deleteByPetId(@Param("petId") Long petId);

      // ✅ ADD THESE METHODS FOR CHATBOT
    
    // Count prescriptions by vet ID
    @Query("SELECT COUNT(p) FROM Prescription p WHERE p.medicalRecord.vet.id = :vetId")
    long countByVetId(@Param("vetId") Long vetId);
    
    // Count prescriptions by pet ID
    @Query("SELECT COUNT(p) FROM Prescription p WHERE p.medicalRecord.pet.id = :petId")
    long countByPetId(@Param("petId") Long petId);
    
    // Count total prescriptions
    @Query("SELECT COUNT(p) FROM Prescription p")
    long countTotalPrescriptions();
    
    // Get recent prescriptions for a pet
    @Query("""
        SELECT p FROM Prescription p 
        WHERE p.medicalRecord.pet.id = :petId 
        ORDER BY p.medicalRecord.createdAt DESC
    """)
    List<Prescription> findRecentByPetId(@Param("petId") Long petId);
    
    // Get prescription count by medicine name
    @Query("SELECT p.medicineName, COUNT(p) FROM Prescription p GROUP BY p.medicineName")
    List<Object[]> countByMedicineName();
}

