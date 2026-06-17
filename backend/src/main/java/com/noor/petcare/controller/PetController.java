package com.jeeva.petcare.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

import com.jeeva.petcare.model.Pet;
import com.jeeva.petcare.service.PetService;

@RestController
@RequestMapping("/pets")
@RequiredArgsConstructor
public class PetController {

    private final PetService petService;

    // CREATE
    @PostMapping("/{userId}")
    public ResponseEntity<?> create(@PathVariable Long userId, @RequestBody Pet pet) {
        try {
            return ResponseEntity.ok(petService.createPet(userId, pet));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET one
    @GetMapping("/{petId}")
    public ResponseEntity<?> get(@PathVariable Long petId) {
        try {
            return ResponseEntity.ok(petService.getPet(petId));
        } catch (RuntimeException e) {
            return new ResponseEntity<>( e.getMessage(),HttpStatus.NOT_FOUND);
        }
    }

    // GET user pets
    @GetMapping("/user/{userId}")
    public List<Pet> getUserPets(@PathVariable Long userId) {
        return petService.getUserPets(userId);
    }

    // UPDATE
    @PutMapping("/{petId}/{userId}")
    public ResponseEntity<?> update(
            @PathVariable Long petId,
            @PathVariable Long userId,
            @RequestBody Pet pet) {
        try {
            return ResponseEntity.ok(petService.updatePet(petId, userId, pet));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE
    @DeleteMapping("/{petId}/{userId}")
    public ResponseEntity<?> delete(@PathVariable Long petId, @PathVariable Long userId) {
        try {
            petService.deletePet(petId, userId);
            return ResponseEntity.ok("Pet deleted");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    // GET ALL PETS
    @GetMapping
    public List<Pet> getAllPets() {
        return petService.getAllPets();
}
//Petcontroller
// All pets that have appointment with a vet
@GetMapping("/vet/{vetId}")
public ResponseEntity<?> getPatientsByVet(@PathVariable Long vetId) {
    return ResponseEntity.ok(petService.getPatientsByVet(vetId));
}

// Summary of a Vets appointment Pet Pet
@GetMapping("/vet/{vetId}/pet/{petId}/summary")
public ResponseEntity<?> getSummary(
        @PathVariable Long vetId,
        @PathVariable Long petId) {

    return ResponseEntity.ok(
        petService.getSummary(vetId, petId)
    );
}

}
