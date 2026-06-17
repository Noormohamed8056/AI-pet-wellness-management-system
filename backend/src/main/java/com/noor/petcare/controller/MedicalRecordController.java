package com.noor.petcare.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.noor.petcare.model.MedicalRecord;
import com.noor.petcare.service.MedicalRecordService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @PostMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> create(
            @PathVariable Long appointmentId,
            @RequestBody MedicalRecord record) {

        try {
            return ResponseEntity.ok(
                    medicalRecordService.create(appointmentId, record));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(medicalRecordService.get(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> getByAppointment(
            @PathVariable Long appointmentId) {

        try {
            return ResponseEntity.ok(
                    medicalRecordService.getByAppointment(appointmentId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

        @PatchMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody MedicalRecord record) {

        try {
            return ResponseEntity.ok(
                    medicalRecordService.update(id, record));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/pet/{petId}")
public ResponseEntity<?> getByPet(@PathVariable Long petId) {

    try {
        return ResponseEntity.ok(
                medicalRecordService.getAllByPet(petId));
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}


}
