package com.noor.petcare.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.noor.petcare.model.VetSlot;
import com.noor.petcare.service.VetSlotService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/slots")
@RequiredArgsConstructor
public class VetSlotController {

    private final VetSlotService vetSlotService;

    // CREATE slot
    @PostMapping("/vet/{vetId}")
    public ResponseEntity<?> createSlot(
            @PathVariable Long vetId,
            @RequestBody VetSlot slot) {

        try {
            return ResponseEntity.ok(vetSlotService.createSlot(vetId, slot));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET all slots of vet
    @GetMapping("/vet/{vetId}")
    public ResponseEntity<?> getVetSlots(@PathVariable Long vetId) {
        try {
            List<VetSlot> slots = vetSlotService.getVetSlots(vetId);
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET available slots
    @GetMapping("/vet/{vetId}/available")
    public ResponseEntity<?> getAvailableSlots(@PathVariable Long vetId) {
        try {
            return ResponseEntity.ok(vetSlotService.getAvailableSlots(vetId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // UPDATE slot
    @PutMapping("/{slotId}/vet/{vetId}")
    public ResponseEntity<?> updateSlot(
            @PathVariable Long slotId,
            @PathVariable Long vetId,
            @RequestBody VetSlot slot) {

        try {
            return ResponseEntity.ok(vetSlotService.updateSlot(slotId, vetId, slot));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE slot
    @DeleteMapping("/{slotId}/vet/{vetId}")
    public ResponseEntity<?> deleteSlot(
            @PathVariable Long slotId,
            @PathVariable Long vetId) {

        try {
            vetSlotService.deleteSlot(slotId, vetId);
            return ResponseEntity.ok("Slot deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
