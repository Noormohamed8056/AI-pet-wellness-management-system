package com.noor.petcare.repository;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.noor.petcare.model.MedicalRecord;

public interface MedicalRecordRepo extends JpaRepository<MedicalRecord, Long> {
    boolean existsByAppointmentId(Long appointmentId);
    Optional<MedicalRecord> findByAppointmentId(Long appointmentId);
    List<MedicalRecord> findByPetId(Long petId);
     @Query("""
        SELECT m.diagnosis
        FROM MedicalRecord m
        WHERE m.vet.id = :vetId
          AND m.pet.id = :petId
        ORDER BY m.createdAt DESC
    """)
    List<String> findLatestDiagnosisRaw(Long vetId, Long petId);
    @Modifying
@Query("""
DELETE FROM MedicalRecord m
WHERE m.pet.id = :petId
""")
void deleteByPetId(@Param("petId") Long petId);


}
