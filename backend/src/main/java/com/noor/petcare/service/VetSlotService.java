package com.jeeva.petcare.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.jeeva.petcare.model.User;
import com.jeeva.petcare.model.VetSlot;
import com.jeeva.petcare.model.User.Role;
import com.jeeva.petcare.repository.UserRepo;
import com.jeeva.petcare.repository.VetSlotRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class VetSlotService {

    private final VetSlotRepo vetSlotRepo;
    private final UserRepo userRepo;

    // CREATE slot
    public VetSlot createSlot(Long vetId, VetSlot slot) {

        User vet = userRepo.findById(vetId)
                .orElseThrow(() -> new RuntimeException("Vet not found"));

        if (vet.getRole() != Role.VET || !vet.isApproved()) {
            throw new RuntimeException("Vet is not approved");
        }

        if (slot.getStartTime().isAfter(slot.getEndTime())) {
            throw new RuntimeException("Invalid time range");
        }

        slot.setVet(vet);
        slot.setAvailable(true);
        List<VetSlot> existingSlots = vetSlotRepo.findByVetIdAndSlotDate(vetId, slot.getSlotDate());

            for (VetSlot existing : existingSlots) {
                boolean overlaps =
                        slot.getStartTime().isBefore(existing.getEndTime()) &&
                        slot.getEndTime().isAfter(existing.getStartTime());

                if (overlaps) {
                    throw new RuntimeException("Slot time overlaps with an existing slot");
                }
            }

        return vetSlotRepo.save(slot);
    }

    // GET all slots of a vet
    public List<VetSlot> getVetSlots(Long vetId) {
        return vetSlotRepo.findByVetId(vetId);
    }

    // GET available slots of a vet
    public List<VetSlot> getAvailableSlots(Long vetId) {
        return vetSlotRepo.findByVetIdAndAvailableTrue(vetId);
    }

    // UPDATE slot
   public VetSlot updateSlot(Long slotId, Long vetId, VetSlot updated) {

    VetSlot slot = vetSlotRepo.findById(slotId)
            .orElseThrow(() -> new RuntimeException("Slot not found"));

    if (!slot.getVet().getId().equals(vetId)) {
        throw new RuntimeException("You can update only your own slots");
    }

    // apply updates first (so we validate final values)
    if (updated.getSlotDate() != null)
        slot.setSlotDate(updated.getSlotDate());

    if (updated.getStartTime() != null)
        slot.setStartTime(updated.getStartTime());

    if (updated.getEndTime() != null)
        slot.setEndTime(updated.getEndTime());

    if (slot.getStartTime().isAfter(slot.getEndTime())) {
        throw new RuntimeException("Invalid time range");
    }

    // overlap check (ignore current slot)
    List<VetSlot> existingSlots =
            vetSlotRepo.findByVetIdAndSlotDate(vetId, slot.getSlotDate());

    for (VetSlot existing : existingSlots) {

        if (existing.getId().equals(slotId)) continue;

        boolean overlaps =
                slot.getStartTime().isBefore(existing.getEndTime()) &&
                slot.getEndTime().isAfter(existing.getStartTime());

        if (overlaps) {
            throw new RuntimeException("Updated slot overlaps with an existing slot");
        }
    }

    return vetSlotRepo.save(slot);
}

    // DELETE slot
    public void deleteSlot(Long slotId, Long vetId) {

        VetSlot slot = vetSlotRepo.findById(slotId)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        if (!slot.getVet().getId().equals(vetId)) {
            throw new RuntimeException("You can delete only your own slots");
        }

        vetSlotRepo.delete(slot);
    }
}
