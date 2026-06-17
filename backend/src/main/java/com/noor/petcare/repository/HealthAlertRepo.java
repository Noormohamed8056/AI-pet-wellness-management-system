package com.jeeva.petcare.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jeeva.petcare.model.HealthAlert;

public interface HealthAlertRepo extends JpaRepository<HealthAlert, Long> {

    List<HealthAlert> findByPetId(Long petId);

    List<HealthAlert> findByPetIdAndResolvedFalse(Long petId);

    boolean existsByPetIdAndAlertTypeAndResolvedFalse(
            Long petId, String alertType);
    @Modifying
@Query("""
DELETE FROM HealthAlert h
WHERE h.pet.id = :petId
""")
void deleteByPetId(@Param("petId") Long petId);

}
