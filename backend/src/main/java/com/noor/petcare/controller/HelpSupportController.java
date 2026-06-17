package com.noor.petcare.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.noor.petcare.model.HelpSupport;
import com.noor.petcare.service.HelpSupportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/help-support")
@RequiredArgsConstructor
public class HelpSupportController {

    private final HelpSupportService service;

    // USER / VET – create
    @PostMapping("/{userId}")
    public ResponseEntity<?> create(
            @PathVariable Long userId,
            @RequestBody String message) {

        try {
            return ResponseEntity.ok(service.create(userId, message));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // USER / VET – update
    @PutMapping("/{id}/user/{userId}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @PathVariable Long userId,
            @RequestBody String message) {

        try {
            return ResponseEntity.ok(service.update(id, userId, message));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // USER / VET – delete
    @DeleteMapping("/{id}/user/{userId}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @PathVariable Long userId) {

        try {
            service.delete(id, userId);
            return ResponseEntity.ok("Query deleted");
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    // USER / VET – own queries
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserQueries(@PathVariable Long userId) {

        try {
            return ResponseEntity.ok(service.getUserQueries(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ADMIN – all
    @GetMapping("/admin")
    public ResponseEntity<?> getAll() {

        try {
            return ResponseEntity.ok(service.getAll());
        } catch (RuntimeException e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    // ADMIN – by role
    @GetMapping("/admin/raised-by/{type}")
    public ResponseEntity<?> getByType(
            @PathVariable HelpSupport.RaisedBy type) {

        try {
            return ResponseEntity.ok(service.getByRaisedBy(type));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ADMIN – by status
    @GetMapping("/admin/status/{status}")
    public ResponseEntity<?> getByStatus(
            @PathVariable HelpSupport.Status status) {

        try {
            return ResponseEntity.ok(service.getByStatus(status));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ADMIN – resolve
    @PutMapping("/admin/{id}/resolve")
    public ResponseEntity<?> resolve(
            @PathVariable Long id,
            @RequestBody String reply) {

        try {
            return ResponseEntity.ok(service.resolve(id, reply));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}
