package com.noor.petcare.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.noor.petcare.model.HelpSupport;
import com.noor.petcare.model.User;
import com.noor.petcare.repository.HelpSupportRepo;
import com.noor.petcare.repository.UserRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class HelpSupportService {

    private final HelpSupportRepo repo;
    private final UserRepo userRepo;

    // CREATE (Owner / Vet)
    public HelpSupport create(Long userId, String message) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        HelpSupport hs = new HelpSupport();
        hs.setUser(user);
        hs.setMessage(message);
        hs.setRaisedBy(
                user.getRole() == User.Role.VET
                        ? HelpSupport.RaisedBy.VET
                        : HelpSupport.RaisedBy.OWNER
        );

        return repo.save(hs);
    }

    // UPDATE (only OPEN)
    public HelpSupport update(Long id, Long userId, String message) {

        HelpSupport hs = getOwnedQuery(id, userId);

        if (hs.getStatus() == HelpSupport.Status.RESOLVED) {
            throw new RuntimeException("Resolved query cannot be edited");
        }

        hs.setMessage(message);
        return repo.save(hs);
    }

    // DELETE (only OPEN)
    public void delete(Long id, Long userId) {

        HelpSupport hs = getOwnedQuery(id, userId);

        if (hs.getStatus() == HelpSupport.Status.RESOLVED) {
            throw new RuntimeException("Resolved query cannot be deleted");
        }

        repo.delete(hs);
    }

    // USER / VET – own queries
    public List<HelpSupport> getUserQueries(Long userId) {
        return repo.findByUserId(userId);
    }

    // ADMIN – all
    public List<HelpSupport> getAll() {
        return repo.findAll();
    }

    // ADMIN – by role
    public List<HelpSupport> getByRaisedBy(HelpSupport.RaisedBy type) {
        return repo.findByRaisedBy(type);
    }

    // ADMIN – by status
    public List<HelpSupport> getByStatus(HelpSupport.Status status) {
        return repo.findByStatus(status);
    }

    // ADMIN – resolve
    public HelpSupport resolve(Long id, String reply) {

        HelpSupport hs = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Query not found"));

        if(hs.getAdminReply()!=null && hs.getStatus()== HelpSupport.Status.RESOLVED)
        {
             throw new RuntimeException("Issue already resolved");
        }
        
        hs.setAdminReply(reply);
        hs.setStatus(HelpSupport.Status.RESOLVED);

        return repo.save(hs);
    }

    // Helper
    private HelpSupport getOwnedQuery(Long id, Long userId) {

        HelpSupport hs = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Query not found"));

        if (!hs.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access");
        }

        return hs;
    }
}
