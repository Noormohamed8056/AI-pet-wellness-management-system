package com.noor.petcare.service;

import java.io.IOException;
import java.nio.file.*;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

import com.noor.petcare.model.User;
import com.noor.petcare.model.VetProfile;
import com.noor.petcare.repository.UserRepo;
import com.noor.petcare.repository.VetProfileRepo;

@Service
@RequiredArgsConstructor
public class VetProfileService {

    private final VetProfileRepo vetProfileRepo;
    private final UserRepo userRepo;

    private static final String BASE_DIR = "uploads/vet-docs";

    // ================= CREATE / UPDATE PROFILE (JSON ONLY) =================
    public VetProfile createOrUpdateProfile(Long userId, VetProfile profile) {

        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != User.Role.VET) {
            throw new RuntimeException("Only vets can have a profile");
        }

        VetProfile existing =
                vetProfileRepo.findByUserId(userId).orElse(new VetProfile());

        existing.setUser(user);

        if (profile.getQualification() != null)
            existing.setQualification(profile.getQualification());

        if (profile.getSpecialization() != null)
            existing.setSpecialization(profile.getSpecialization());

        if (profile.getHospitalName() != null)
            existing.setHospitalName(profile.getHospitalName());

        if (profile.getExperienceYears() > 0)
            existing.setExperienceYears(profile.getExperienceYears());

        if (profile.getLicenseNumber() != null)
            existing.setLicenseNumber(profile.getLicenseNumber());

        if (profile.getConsultationFee() > 0)
            existing.setConsultationFee(profile.getConsultationFee());

        if (profile.getBio() != null)
            existing.setBio(profile.getBio());

        return vetProfileRepo.save(existing);
    }

    // ================= UPLOAD DOCUMENTS (PDF ONLY) =================
    public void uploadDocuments(
            Long userId,
            MultipartFile degreeCertificate,
            MultipartFile medicalRegistrationCertificate,
            MultipartFile identityProof) {

        VetProfile profile = vetProfileRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Vet profile not found"));

        try {
            Files.createDirectories(Paths.get(BASE_DIR));

            if (degreeCertificate != null && !degreeCertificate.isEmpty()) {
                profile.setDegreeCertificateUrl(
                        savePdf(degreeCertificate, userId, "degree"));
            }

            if (medicalRegistrationCertificate != null
                    && !medicalRegistrationCertificate.isEmpty()) {
                profile.setMedicalRegistrationCertificateUrl(
                        savePdf(medicalRegistrationCertificate, userId, "medical_reg"));
            }

            if (identityProof != null && !identityProof.isEmpty()) {
                profile.setIdentityProofUrl(
                        savePdf(identityProof, userId, "identity"));
            }

        } catch (IOException e) {
            throw new RuntimeException("PDF upload failed");
        }

        vetProfileRepo.save(profile);
    }

    // ================= GET =================
    public VetProfile getByUser(Long userId) {
        return vetProfileRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Vet profile not found"));
    }

    // ================= DELETE =================
    public void delete(Long userId) {
        VetProfile profile = vetProfileRepo.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Vet profile not found"));

        User user = profile.getUser();
        user.setVetProfile(null);

        vetProfileRepo.delete(profile);
    }

    // ================= HELPERS =================
    private String savePdf(MultipartFile file, Long userId, String prefix)
            throws IOException {

        validatePdf(file);

        String fileName =
                prefix + "_" + userId + "_" + System.currentTimeMillis() + ".pdf";

        Path filePath = Paths.get(BASE_DIR).resolve(fileName);
        Files.write(filePath, file.getBytes());

        return "/uploads/vet-docs/" + fileName;
    }

    private void validatePdf(MultipartFile file) {

        if (!"application/pdf".equalsIgnoreCase(file.getContentType())) {
            throw new RuntimeException("Only PDF files are allowed");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("PDF size must be less than 5MB");
        }
    }
}
