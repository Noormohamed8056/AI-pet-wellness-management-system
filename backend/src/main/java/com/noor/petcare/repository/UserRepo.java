//UserRepo.java
package com.jeeva.petcare.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.jeeva.petcare.model.User;

public interface UserRepo extends JpaRepository<User, Long>{
    
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findByVerificationToken(String token);
    long countByRole(User.Role role);
    long countByRoleAndApprovedFalse(User.Role role);

    List<User> findByRole(User.Role role);
    // ✅ ADD THESE METHODS FOR CHATBOT
    long countByRoleAndApproved(User.Role role, boolean approved);
    
    
    @Query("SELECT COUNT(u) FROM User u")
    long countTotalUsers();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'VET' AND u.approved = true")
    long countApprovedVets();
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = 'OWNER'")
    long countPetOwners();

} 
