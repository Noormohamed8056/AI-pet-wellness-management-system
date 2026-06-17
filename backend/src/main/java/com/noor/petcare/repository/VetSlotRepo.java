package com.noor.petcare.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.noor.petcare.model.VetSlot;

public interface VetSlotRepo extends JpaRepository<VetSlot, Long> {

    List<VetSlot> findByVetId(Long vetId);

    List<VetSlot> findByVetIdAndAvailableTrue(Long vetId);

    List<VetSlot> findBySlotDate(LocalDate date);

    List<VetSlot> findByVetIdAndSlotDate(Long vetId, LocalDate slotDate);

}
