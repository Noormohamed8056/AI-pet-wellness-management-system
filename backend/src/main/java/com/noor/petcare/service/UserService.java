//UserService.java
package com.jeeva.petcare.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.jeeva.petcare.dto.LoginRequest;
import com.jeeva.petcare.dto.LoginResponse;
import com.jeeva.petcare.dto.RegisterRequest;
import com.jeeva.petcare.model.User;
import com.jeeva.petcare.repository.PetRepo;
import com.jeeva.petcare.repository.UserRepo;
import com.jeeva.petcare.repository.VetProfileRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepo userRepo;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final VetProfileRepo vetProfileRepo;
    private final PetRepo petRepo;

    // REGISTER
   public User register(RegisterRequest request) {

    if (userRepo.existsByEmail(request.getEmail())) {
        throw new RuntimeException("Email already registered");
    }

    User user = new User();
    user.setName(request.getName());
    user.setEmail(request.getEmail());
    user.setPassword(passwordEncoder.encode(request.getPassword()));
    user.setPhone(request.getPhone());
    user.setRole(request.getRole());

    user.setEmailVerified(false);

    String token = UUID.randomUUID().toString();
    user.setVerificationToken(token);

    if (request.getRole() == User.Role.VET) {
        user.setApproved(false);
    } else {
        user.setApproved(true);
    }

    User saved = userRepo.save(user);

        try {
        sendVerificationEmail(saved.getEmail(), token);
    } catch (Exception e) {
        // Log but do NOT block registration
        System.out.println("Email failed: " + e.getMessage());
    }

    return saved;
}

    // SEND AN EMAIL
    private void sendVerificationEmail(String email, String token) {
        String link = "http://localhost:8080/users/verify?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Verify your Smart Pet Care account");
        message.setText("Click to verify your email:\n" + link);

        mailSender.send(message);
    }

    // VERIFY EMAIL
    public void verifyEmail(String token) {
    User user = userRepo.findByVerificationToken(token)
            .orElseThrow(() -> new RuntimeException("Invalid token"));

    user.setEmailVerified(true);
    user.setVerificationToken(null);
    userRepo.save(user);
}

    // LOGIN
public LoginResponse login(LoginRequest request) {

    User user = userRepo.findByEmail(request.getEmail())
            .orElseThrow(() -> new RuntimeException("Invalid email or password"));

    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        throw new RuntimeException("Invalid email or password");
    }

    boolean needsProfile = false;
    boolean pendingApproval = false;

    if (user.getRole() == User.Role.VET) {

        boolean hasProfile = vetProfileRepo.existsByUserId(user.getId());

        // Vet has NOT filled profile yet
        if (!hasProfile) {
            needsProfile = true;
        }

        // Vet has profile but admin not approved
        else if (!user.isApproved()) {
            pendingApproval = true;
        }
    }

    return new LoginResponse(
            user.getId(),
            user.getRole().name(),
            needsProfile,
            pendingApproval,
            "Login successful"
    );
}

    // get a user
    public User getProfile(Long userId) {
        return userRepo.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User updateProfile(Long userId, User updatedUser) {

    User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

    if(updatedUser.getName() == null ||
        updatedUser.getName().length() < 3 )
         {
        throw new RuntimeException("Name must be between 3 and 50 characters");
        }

    if (updatedUser.getPhone() == null ||
        !updatedUser.getPhone().matches("^[6-9]\\d{9}$")) {
        throw new RuntimeException("Invalid phone number");
    }

    user.setName(updatedUser.getName());
    user.setPhone(updatedUser.getPhone());

        return userRepo.save(user);
    }

    public List<User> getPendingVets() {

    return userRepo.findAll().stream()
            .filter(u -> u.getRole() == User.Role.VET && !u.isApproved())
            .toList();
    }

    public void approveVet(Long vetId) 
  {
    User user = userRepo.findById(vetId)
            .orElseThrow(() -> new RuntimeException("User not found"));

    if (!vetProfileRepo.existsByUserId(vetId)) {
        throw new RuntimeException("Vet profile not completed");
    }

    if (user.getRole() != User.Role.VET) {
        throw new RuntimeException("User is not a vet");
    }
    user.setApproved(true);
    userRepo.save(user);
  }

  
  public void deleteUser(Long userId) {
    User user = userRepo.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

    userRepo.delete(user);
}


    public void resetPassword(Long userId, String newPassword) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepo.save(user);
    }
    public User patchUser(Long userId, Map<String, Object> updates) {

    User user = userRepo.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

    if (updates.containsKey("name")) {
        String name = updates.get("name").toString().trim();
        if (name.length() < 3) {
            throw new RuntimeException("Name must be at least 3 characters");
        }
        user.setName(name);
    }

    if (updates.containsKey("phone")) {
        String phone = updates.get("phone").toString();
        if (!phone.matches("^[6-9]\\d{9}$")) {
            throw new RuntimeException("Invalid phone number");
        }
        user.setPhone(phone);
    }

    return userRepo.save(user);
}


public Map<String, Long> getAdminStats() {

    long totalUsers = userRepo.count();
    long totalVets = userRepo.countByRole(User.Role.VET);
    long totalPetOwners = userRepo.countByRole(User.Role.OWNER);
    long pendingVets = userRepo.countByRoleAndApprovedFalse(User.Role.VET);
    long totalPets = petRepo.count();

    Map<String, Long> stats = new HashMap<>();
    stats.put("totalUsers", totalUsers);
    stats.put("totalPetOwners", totalPetOwners);
    stats.put("totalVets", totalVets);
    stats.put("pendingVets", pendingVets);
    stats.put("totalPets", totalPets);

    return stats;
}
    public List<User> getAllVets() {
    return userRepo.findByRole(User.Role.VET);
}

public List<User> getAllPetOwners() {
    return userRepo.findByRole(User.Role.OWNER);
}


}
