package com.noor.petcare.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.noor.petcare.model.HealthMetric;
import com.noor.petcare.service.HealthMetricService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/health-metrics")
@RequiredArgsConstructor
public class HealthMetricController {

    private final HealthMetricService service;

    // CREATE
    // 🐾 OWNER adds daily metrics
    @PostMapping("/pet/{petId}/owner")
    public ResponseEntity<?> addByOwner(
            @PathVariable Long petId,
            @RequestBody HealthMetric metric) {

        try {
            return ResponseEntity.ok(
                    service.addMetricByOwner(petId, metric));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 🩺 VET adds clinical metrics
    @PostMapping("/pet/{petId}/vet")
    public ResponseEntity<?> addByVet(
            @PathVariable Long petId,
            @RequestBody HealthMetric metric) {

        try {
            return ResponseEntity.ok(
                    service.addMetricByVet(petId, metric));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // GET single
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getMetric(id));
        } catch (RuntimeException e) {
            return new ResponseEntity<>( e.getMessage(),HttpStatus.NOT_FOUND);
        }
    }

    // GET all metrics of a pet
    @GetMapping("/pet/{petId}")
    public List<HealthMetric> getPetMetrics(@PathVariable Long petId) {
        return service.getPetMetrics(petId);
    }
    
    // Get a vets appointments pets metrics
    @GetMapping("/vet/{vetId}")
    public ResponseEntity<?> getVetPetsMetrics(@PathVariable Long vetId) {
        return ResponseEntity.ok(service.getVetPetsMetrics(vetId));
    }


    // GET metrics by date
    @GetMapping("/pet/{petId}/date")
    public List<HealthMetric> getByDate(
            @PathVariable Long petId,
            @RequestParam String date) {
        return service.getMetricsByDate(petId, LocalDate.parse(date));
    }

    // UPDATE
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody HealthMetric metric) {
        try {
            return ResponseEntity.ok(service.updateMetric(id, metric));
        } catch (RuntimeException e) {
            return new ResponseEntity<>( e.getMessage(),HttpStatus.NOT_FOUND);
        }
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.deleteMetric(id);
            return ResponseEntity.ok("Health metric deleted");
        } catch (RuntimeException e) {
            return new ResponseEntity<>( e.getMessage(),HttpStatus.NOT_FOUND);
        }
    }
}
