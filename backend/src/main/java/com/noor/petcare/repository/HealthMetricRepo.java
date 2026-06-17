package com.noor.petcare.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.noor.petcare.model.HealthMetric;

public interface HealthMetricRepo extends JpaRepository<HealthMetric, Long> {

    List<HealthMetric> findByPetId(Long petId);

    List<HealthMetric> findByPetIdOrderByDateDesc(Long petId);

    List<HealthMetric> findByPetIdAndDate(Long petId, LocalDate date);

    @Modifying
@Query("""
DELETE FROM HealthMetric h
WHERE h.pet.id = :petId
""")
void deleteByPetId(@Param("petId") Long petId);


}   