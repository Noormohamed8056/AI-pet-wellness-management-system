// FeedbackRepo.java
package com.noor.petcare.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.noor.petcare.model.Feedback;

public interface FeedbackRepo extends JpaRepository<Feedback, Long> {

    boolean existsByAppointmentId(Long appointmentId);

    List<Feedback> findByVetId(Long vetId);

    List<Feedback> findByUserId(Long userId);

    Optional<Feedback> findByAppointmentId(Long appointmentId);
    @Modifying
@Query("""
DELETE FROM Feedback f
WHERE f.appointment.pet.id = :petId
""")
void deleteByPetId(@Param("petId") Long petId);

}
