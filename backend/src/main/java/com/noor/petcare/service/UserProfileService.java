package com.jeeva.petcare.service;

import java.util.List;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;

import com.jeeva.petcare.model.User;
import com.jeeva.petcare.model.UserProfile;
import com.jeeva.petcare.repository.UserProfileRepository;
import com.jeeva.petcare.repository.UserRepo;

@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserProfileRepository profileRepo;
    private final UserRepo userRepo;

    // CREATE or UPDATE (PATCH-safe)
    public UserProfile createOrUpdate(Long userId, UserProfile profile) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != User.Role.OWNER) {
            throw new RuntimeException("Only pet owners can have a user profile");
        }

        UserProfile existing = profileRepo.findByUserId(userId).orElse(null);

        if (existing != null) {

            if (profile.getFullName() != null)
                existing.setFullName(profile.getFullName());

            if (profile.getAddress() != null)
                existing.setAddress(profile.getAddress());

            if (profile.getCity() != null)
                existing.setCity(profile.getCity());

            if (profile.getState() != null)
                existing.setState(profile.getState());

            if (profile.getPincode() != null)
                existing.setPincode(profile.getPincode());

            if (profile.getProfileImageUrl() != null)
                existing.setProfileImageUrl(profile.getProfileImageUrl());

            if (profile.getBio() != null)
                existing.setBio(profile.getBio());

            return profileRepo.save(existing);
        }

        profile.setUser(user);
        return profileRepo.save(profile);
    }

    // GET one
    public UserProfile getByUser(Long userId) {
        return profileRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
    }

    // GET all owner profiles
    public List<UserProfile> getAllProfiles() {
        return profileRepo.findAll();
    }

    // DELETE
    public void delete(Long userId) {

    UserProfile profile = profileRepo.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("User profile not found"));

    User user = profile.getUser();

    // Break the relationship
    user.setUserProfile(null);

    // Delete child explicitly
    profileRepo.delete(profile);
}

}
