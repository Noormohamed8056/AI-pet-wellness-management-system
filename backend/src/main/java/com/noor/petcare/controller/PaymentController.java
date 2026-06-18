package com.noor.petcare.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.noor.petcare.service.PaymentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    // ================= APPOINTMENT PAYMENT =================
    @PostMapping("/create")
    public ResponseEntity<?> createAppointmentPayment(
            @RequestParam Long appointmentId) {

        try {
            return ResponseEntity.ok(
                    paymentService.createPayment(appointmentId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ================= ORDER PAYMENT =================
    @PostMapping("/order/create")
    public ResponseEntity<?> createOrderPayment(
            @RequestParam Long orderId) {

        try {
            return ResponseEntity.ok(
                    paymentService.createOrderPayment(orderId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @PostMapping("/success")
    public ResponseEntity<?> success(
            @RequestParam Long paymentId,
            @RequestParam String razorpayPaymentId,
            @RequestParam(required = false) String razorpayOrderId,
            @RequestParam(required = false) String razorpaySignature) {

        try {
            return ResponseEntity.ok(
                    paymentService.markSuccess(paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
