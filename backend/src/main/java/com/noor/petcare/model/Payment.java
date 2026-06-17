package com.jeeva.petcare.model;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String razorpayOrderId;
    private String razorpayPaymentId;

    private Integer amount;
    private String currency;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = true)
    @JsonIgnore
    private Appointment appointment;

    public enum Status {
        CREATED,
        SUCCESS,
        FAILED,
        REFUNDED   // ✅ add this
    }
    // ADD these fields
    private Long referenceId;

    @Enumerated(EnumType.STRING)
    private ReferenceType referenceType;

    public enum ReferenceType {
        APPOINTMENT,
        ORDER
    }

}
