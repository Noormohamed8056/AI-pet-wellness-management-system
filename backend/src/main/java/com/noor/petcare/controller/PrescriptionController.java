package com.noor.petcare.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.noor.petcare.model.Prescription;
import com.noor.petcare.service.PrescriptionService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;

    @PostMapping("/medical-record/{recordId}")
    public ResponseEntity<?> add(
            @PathVariable Long recordId,
            @RequestBody Prescription p) {

        try {
            return ResponseEntity.ok(
                    prescriptionService.add(recordId, p));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            prescriptionService.delete(id);
            return ResponseEntity.ok("Prescription deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/medical-record/{recordId}")
    public ResponseEntity<?> getByMedicalRecord(@PathVariable Long recordId) {
    try {
        return ResponseEntity.ok(
                prescriptionService.getByMedicalRecord(recordId));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
   }

   @PatchMapping("/{id}")
public ResponseEntity<?> update(
        @PathVariable Long id,
        @RequestBody Prescription p) {

    try {
        return ResponseEntity.ok(
                prescriptionService.update(id, p));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@GetMapping("/{id}")
public ResponseEntity<?> get(@PathVariable Long id) {

    try {
        return ResponseEntity.ok(
                prescriptionService.get(id));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}

@GetMapping("/pet/{petId}")
public ResponseEntity<?> getByPet(@PathVariable Long petId) {

    try {
        return ResponseEntity.ok(
                prescriptionService.getByPet(petId));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}
 @GetMapping("/{vetId}/prescriptions/count")
    public long getPrescriptionCount(@PathVariable Long vetId) {
        return prescriptionService.getTotalPrescriptions(vetId);
    }

}