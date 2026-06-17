package com.jeeva.petcare.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jeeva.petcare.model.Vaccination;

public interface VaccinationRepository extends JpaRepository<Vaccination, Long> {

    List<Vaccination> findByPetId(Long petId);

    List<Vaccination> findByVetId(Long vetId);

    boolean existsByAppointmentId(Long appointmentId);

    List<Vaccination> findByAppointmentId(Long appointmentId);
    long countByPetId(Long petId);
    // ✅ ADD THESE METHODS FOR CHATBOT
    
    
    // Count vaccinations by vet
    long countByVetId(Long vetId);
    
    // Count total vaccinations
    @Query("SELECT COUNT(v) FROM Vaccination v")
    long countTotalVaccinations();

    @Modifying
@Query("""
DELETE FROM Vaccination v
WHERE v.pet.id = :petId
""")
void deleteByPetId(@Param("petId") Long petId);

    
    // Get upcoming vaccinations (due in next 30 days)
    @Query("""
        SELECT v FROM Vaccination v 
        WHERE v.nextDueDate BETWEEN :startDate AND :endDate
        ORDER BY v.nextDueDate ASC
    """)
    List<Vaccination> findUpcomingVaccinations(
            @Param("startDate") LocalDate startDate, 
            @Param("endDate") LocalDate endDate
    );
    
    // Get overdue vaccinations
    @Query("""
        SELECT v FROM Vaccination v 
        WHERE v.nextDueDate < CURRENT_DATE 
        AND v.status != 'DONE'
        ORDER BY v.nextDueDate ASC
    """)
    List<Vaccination> findOverdueVaccinations();
    
    // Get vaccination count by status
    @Query("SELECT v.status, COUNT(v) FROM Vaccination v GROUP BY v.status")
    List<Object[]> countByStatus();
    
    // Get vaccination count by type
    @Query("SELECT v.type, COUNT(v) FROM Vaccination v GROUP BY v.type")
    List<Object[]> countByType();
}
