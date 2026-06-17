package com.jeeva.petcare.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.jeeva.petcare.model.Appointment;
import com.jeeva.petcare.model.Pet;

public interface AppointmentRepo extends JpaRepository<Appointment, Long> {
    List<Appointment> findByUserIdAndStatusIn(Long userId, List<Appointment.Status> statuses);

List<Appointment> findByVetIdAndStatusIn(Long vetId, List<Appointment.Status> statuses);

boolean existsByPetIdAndVetIdAndStatusIn(
        Long petId,
        Long vetId,
        List<Appointment.Status> statuses
    );


    List<Appointment> findByVet_IdAndStatusIn(
        Long vetId,
        List<Appointment.Status> statuses
);

List<Appointment> findByVet_IdAndStatus(
        Long vetId,
        Appointment.Status status
);

@Query("""
    SELECT DISTINCT a.pet
    FROM Appointment a
    WHERE a.vet.id = :vetId
      AND a.status = :status
""")
List<Pet> findDistinctPetsByVetAndStatus(
    Long vetId,
    Appointment.Status status
);

List<Appointment> findByVetIdAndPetIdAndStatus(
    Long vetId,
    Long petId,
    Appointment.Status status
);

    long countByVetIdAndPetIdAndStatus(
        Long vetId,
        Long petId,
        Appointment.Status status
    );

    @Query("""
    SELECT MAX(a.slot.slotDate)
    FROM Appointment a
    WHERE a.vet.id = :vetId
      AND a.pet.id = :petId
      AND a.status = :status
""")
LocalDate findLastVisitDate(
    Long vetId,
    Long petId,
    Appointment.Status status
);
  // ✅ ADD THESE METHODS FOR CHATBOT
    
    // Find all appointments by user ID
    List<Appointment> findByUserId(Long userId);
    
    // Find all appointments by vet ID
    List<Appointment> findByVetId(Long vetId);
    
    // Count total appointments
    @Query("SELECT COUNT(a) FROM Appointment a")
    long countTotalAppointments();
    
    // Count appointments by user
    long countByUserId(Long userId);
    
    // Count appointments by vet
    long countByVetId(Long vetId);
    
    // Find upcoming appointments for user (future dates)
    @Query("""
        SELECT a FROM Appointment a 
        WHERE a.user.id = :userId 
        AND a.status IN :statuses 
        AND a.slot.slotDate >= CURRENT_DATE 
        ORDER BY a.slot.slotDate ASC
    """)
    List<Appointment> findUserUpcomingAppointments(
            @Param("userId") Long userId, 
            @Param("statuses") List<Appointment.Status> statuses
    );
    
    // Find upcoming appointments for vet
    @Query("""
        SELECT a FROM Appointment a 
        WHERE a.vet.id = :vetId 
        AND a.status IN :statuses 
        AND a.slot.slotDate >= CURRENT_DATE 
        ORDER BY a.slot.slotDate ASC
    """)
    List<Appointment> findVetUpcomingAppointments(
            @Param("vetId") Long vetId, 
            @Param("statuses") List<Appointment.Status> statuses
    );
    
    // Count completed appointments
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.status = 'COMPLETED'")
    long countCompletedAppointments();
    
    // Count today's appointments
    @Query("""
        SELECT COUNT(a) FROM Appointment a 
        WHERE a.slot.slotDate = CURRENT_DATE
    """)
    long countTodayAppointments();
    
    // Get appointment statistics by status
    @Query("""
        SELECT a.status, COUNT(a) 
        FROM Appointment a 
        GROUP BY a.status
    """)
    List<Object[]> countByStatus();
    long countByPet_Id(Long petId);

    long countByPetId(Long petId);

   @Modifying
@Query("""
DELETE FROM Appointment a
WHERE a.pet.id = :petId
""")
void deleteByPetId(@Param("petId") Long petId);

List<Appointment> findByStatus(Appointment.Status status);

List<Appointment> findByCreatedAtBetween(
        LocalDateTime start,
        LocalDateTime end);



}
