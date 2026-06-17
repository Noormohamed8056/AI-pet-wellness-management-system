package com.noor.petcare.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.noor.petcare.model.Payment;

public interface PaymentRepo extends JpaRepository<Payment, Long> {
    Optional<Payment> findByReferenceTypeAndReferenceId(
            Payment.ReferenceType referenceType,
            Long referenceId
    );
    @Modifying
@Query("""
DELETE FROM Payment p
WHERE p.appointment.pet.id = :petId
""")
void deleteByPetId(@Param("petId") Long petId);

}
