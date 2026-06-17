package com.noor.petcare.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.noor.petcare.model.HealthAlert;
import com.noor.petcare.service.HealthAlertService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/alerts")
@RequiredArgsConstructor
public class HealthAlertController {

    private final HealthAlertService service;

    // GET all alerts of a pet
    @GetMapping("/pet/{petId}")
    public List<HealthAlert> getAlerts(@PathVariable Long petId) {
        return service.getAlertsByPet(petId);
    }

    // GET active alerts
    @GetMapping("/pet/{petId}/active")
    public List<HealthAlert> getActiveAlerts(@PathVariable Long petId) {
        return service.getActiveAlerts(petId);
    }

    // GET single alert
    @GetMapping("/{id}")
    public ResponseEntity<?> getAlert(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getAlert(id));
        } catch (RuntimeException e) {
            return new ResponseEntity<>( e.getMessage(),HttpStatus.NOT_FOUND);
        }
    }

    // RESOLVE alert
    @PutMapping("/{id}/resolve")
    public ResponseEntity<?> resolve(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.resolveAlert(id));
        } catch (RuntimeException e) {
            return new ResponseEntity<>( e.getMessage(),HttpStatus.BAD_REQUEST);
        }
    }

    // DELETE alert
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.deleteAlert(id);
            return ResponseEntity.ok("Health alert deleted");
        } catch (RuntimeException e) {
            return new ResponseEntity<>( e.getMessage(),HttpStatus.NOT_FOUND);
        }
    }
}
