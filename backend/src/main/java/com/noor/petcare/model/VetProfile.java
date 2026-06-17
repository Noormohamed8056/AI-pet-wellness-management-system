package com.noor.petcare.model;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VetProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JsonBackReference
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    private String qualification;
    private String specialization;
    private String hospitalName;
    private int experienceYears;
    private String licenseNumber;
    private String bio;
    private int consultationFee;

     private String degreeCertificateUrl;
    private String medicalRegistrationCertificateUrl;
    private String identityProofUrl;
}
