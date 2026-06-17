package com.jeeva.petcare.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.jeeva.petcare.model.Vaccination;
import com.jeeva.petcare.service.VaccinationService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/vaccinations")
@RequiredArgsConstructor
public class VaccinationController {

    private final VaccinationService vaccinationService;

    // CREATE (LOCKED TO APPOINTMENT)
    @PostMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> create(
            @PathVariable Long appointmentId,
            @RequestParam Long vetId,
            @RequestBody Vaccination vaccination) {

        try {
            return ResponseEntity.ok(
                    vaccinationService.createFromAppointment(
                            appointmentId, vetId, vaccination));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET one
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(vaccinationService.get(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // GET pet vaccinations
    @GetMapping("/pet/{petId}")
    public ResponseEntity<?> getPetVaccinations(@PathVariable Long petId) {
        try {
            return ResponseEntity.ok(
                    vaccinationService.getPetVaccinations(petId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET vet vaccinations
    @GetMapping("/vet/{vetId}")
    public ResponseEntity<?> getVetVaccinations(@PathVariable Long vetId) {
        try {
            return ResponseEntity.ok(
                    vaccinationService.getVetVaccinations(vetId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Vaccination vaccination) {

        try {
            return ResponseEntity.ok(
                    vaccinationService.update(id, vaccination));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            vaccinationService.delete(id);
            return ResponseEntity.ok("Vaccination deleted");
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // VaccinationController.java

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<?> getByAppointment(
            @PathVariable Long appointmentId) {

        try {
            return ResponseEntity.ok(
                    vaccinationService.getByAppointment(appointmentId)
            );
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}
