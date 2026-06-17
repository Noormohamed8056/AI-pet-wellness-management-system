//UserController.java
package com.noor.petcare.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.noor.petcare.dto.LoginRequest;
import com.noor.petcare.dto.LoginResponse;
import com.noor.petcare.dto.RegisterRequest;
import com.noor.petcare.model.User;
import com.noor.petcare.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;


    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
    try {
        User savedUser = userService.register(request);
        return new ResponseEntity<>(savedUser, HttpStatus.CREATED);
    } 
    catch (RuntimeException e) {
        return new ResponseEntity<>(e.getMessage(), HttpStatus.CONFLICT);
    }
}

    @GetMapping("/verify")
    public String verifyEmail(@RequestParam String token) {
        userService.verifyEmail(token);
        return "Email verified successfully. You can now login.";
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {

        try{
            LoginResponse savedLogin = userService.login(request);
            return new ResponseEntity<>(savedLogin, HttpStatus.OK);
        }
        catch(RuntimeException e){
            return new ResponseEntity<>(e.getMessage(),HttpStatus.CONFLICT);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProfile(@PathVariable Long id) {
    try {
        return ResponseEntity.ok(userService.getProfile(id));
       } 
    catch (RuntimeException e) {
        return new ResponseEntity<>( e.getMessage(),HttpStatus.NOT_FOUND);
     }
  }

  @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Long id,  @RequestBody User user) {
        try {
             User updated = userService.updateProfile(id, user);
             return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/admin/vets/pending")
    public ResponseEntity<List<User>> getPendingVets() {
        return ResponseEntity.ok(userService.getPendingVets());
    }

    @PutMapping("/admin/vets/{id}/approve")
    public ResponseEntity<String> approveVet(@PathVariable Long id) {
        try {
            userService.approveVet(id);
            return new ResponseEntity<>("Vet approved successfully", HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok("User deleted successfully");
        } catch (RuntimeException e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.NOT_FOUND);
        }
    }

        @GetMapping("/admin/stats")
    public ResponseEntity<?> getAdminStats() {
        return ResponseEntity.ok(userService.getAdminStats());
    }

        @GetMapping("/admin/vets")
    public ResponseEntity<List<User>> getAllVets() {
        return ResponseEntity.ok(userService.getAllVets());
    }

    @GetMapping("/admin/owners")
    public ResponseEntity<List<User>> getAllOwners() {
        return ResponseEntity.ok(userService.getAllPetOwners());
    }

    @PutMapping("/{id}/reset-password")
    public ResponseEntity<String> resetPassword(
            @PathVariable Long id,
            @RequestParam String password) {    

        userService.resetPassword(id, password);
        return ResponseEntity.ok("Password reset successful");
    }

}
