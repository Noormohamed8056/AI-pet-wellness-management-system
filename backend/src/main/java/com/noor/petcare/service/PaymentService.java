//PaymentService
package com.jeeva.petcare.service;

import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.jeeva.petcare.config.RazorpayConfig;
import com.jeeva.petcare.model.*;
import com.jeeva.petcare.repository.*;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class PaymentService {

    // ============================================================
    // DEV/TEST MODE: Set to true to skip real Razorpay API calls.
    // Set to false (or remove) before going to production.
    // ============================================================
    @Value("${payment.mock.enabled:true}")
    private boolean mockPaymentEnabled;

    private final PaymentRepo paymentRepo;
    private final AppointmentRepo appointmentRepo;
    private final RazorpayConfig razorpayConfig;
    private final JavaMailSender mailSender;
    private final OrderRepo orderRepo;
    private final CartRepo cartRepo;

    @Transactional
    public Payment createPayment(Long appointmentId) throws RazorpayException {

        Appointment appt = appointmentRepo.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        if (appt.getStatus() != Appointment.Status.BOOKED) {
            throw new RuntimeException("Appointment not in BOOKED state");
        }

        int amount = 500 * 100; // paise

        // Reuse existing payment when possible; appointment checkout always needs a real Razorpay order.
        if (appt.getPayment() != null) {
            Payment existingPayment = appt.getPayment();

            if (existingPayment.getStatus() == Payment.Status.SUCCESS) {
                throw new RuntimeException("Payment already completed");
            }

            if (isMockRazorpayOrder(existingPayment.getRazorpayOrderId())) {
                String razorpayOrderId = createAppointmentRazorpayOrder(amount, appointmentId);
                existingPayment.setRazorpayOrderId(razorpayOrderId);
                return paymentRepo.save(existingPayment);
            }

            return existingPayment;
        }

        String razorpayOrderId = createAppointmentRazorpayOrder(amount, appointmentId);

        Payment payment = new Payment();
        payment.setAppointment(appt);
        payment.setReferenceType(Payment.ReferenceType.APPOINTMENT);
        payment.setReferenceId(appointmentId);
        payment.setAmount(amount / 100);
        payment.setCurrency("INR");
        payment.setStatus(Payment.Status.CREATED);
        payment.setRazorpayOrderId(razorpayOrderId);

        paymentRepo.save(payment);

        appt.setPayment(payment);
        appointmentRepo.save(appt);

        return payment;
    }

    private boolean isMockRazorpayOrder(String razorpayOrderId) {
        return razorpayOrderId != null && razorpayOrderId.startsWith("mock_order_");
    }

    private String createAppointmentRazorpayOrder(int amountPaise, Long appointmentId) throws RazorpayException {
        RazorpayClient client = razorpayConfig.getRazorpayClient();
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amountPaise);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "apt_" + appointmentId);
        com.razorpay.Order order = client.orders.create(orderRequest);
        return order.get("id");
    }

 @Transactional
public Payment createOrderPayment(Long orderId) throws RazorpayException {

    Order order = orderRepo.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));

    if (order.getStatus() != Order.Status.CREATED) {
        throw new RuntimeException("Order not in CREATED state");
    }

    Payment existing = paymentRepo
            .findByReferenceTypeAndReferenceId(
                    Payment.ReferenceType.ORDER, orderId)
            .orElse(null);

    if (existing != null) {
        if (existing.getStatus() == Payment.Status.SUCCESS) {
            throw new RuntimeException("Order already paid");
        }
        return existing;
    }

    int amount = order.getTotalAmount().intValue() * 100;

    // --- MOCK / REAL gateway selection ---
    String razorpayOrderId;
    if (mockPaymentEnabled) {
        // DEV MODE: generate a fake order ID, no network call
        razorpayOrderId = "mock_order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        System.out.println("[MOCK PAYMENT] Shop order created: " + razorpayOrderId);
    } else {
        RazorpayClient client = razorpayConfig.getRazorpayClient();
        JSONObject orderRequest = new JSONObject();
        orderRequest.put("amount", amount);
        orderRequest.put("currency", "INR");
        orderRequest.put("receipt", "order_" + orderId);
        com.razorpay.Order razorpayOrder = client.orders.create(orderRequest);
        razorpayOrderId = razorpayOrder.get("id");
    }

    Payment payment = new Payment();
    payment.setReferenceType(Payment.ReferenceType.ORDER);
    payment.setReferenceId(orderId);
    payment.setAmount(amount / 100);
    payment.setCurrency("INR");
    payment.setStatus(Payment.Status.CREATED);
    payment.setRazorpayOrderId(razorpayOrderId);

    return paymentRepo.save(payment);
}
@Transactional
public void refundOrderPayment(Long orderId) {

    Payment payment = paymentRepo
            .findByReferenceTypeAndReferenceId(
                    Payment.ReferenceType.ORDER, orderId)
            .orElse(null);

    // No payment → nothing to refund
    if (payment == null) {
        return;
    }

    // Only refund successful payments
    if (payment.getStatus() != Payment.Status.SUCCESS) {
        return;
    }

    // 🔁 DUMMY refund (NO Razorpay call)
    payment.setStatus(Payment.Status.REFUNDED);
    paymentRepo.save(payment);
}



@Transactional
public Payment markSuccess(Long paymentId, String razorpayPaymentId) {

    Payment payment = paymentRepo.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found"));

    // In mock mode allow re-marking (idempotent), otherwise block duplicates
    if (payment.getStatus() == Payment.Status.SUCCESS) {
        return payment; // already done – return silently
    }

    if (payment.getStatus() != Payment.Status.CREATED) {
        throw new RuntimeException("Invalid payment status");
    }

    payment.setRazorpayPaymentId(razorpayPaymentId);
    payment.setStatus(Payment.Status.SUCCESS);

    // 🔹 Appointment flow (unchanged)
    if (payment.getReferenceType() == Payment.ReferenceType.APPOINTMENT) {

        Appointment appt = payment.getAppointment();
        appt.setStatus(Appointment.Status.PAID);
        appointmentRepo.save(appt);

        sendAppointmentBookedEmail(appt);
    }

    // 🔹 Order flow (NEW)
    else if (payment.getReferenceType() == Payment.ReferenceType.ORDER) {

        Order order = orderRepo.findById(payment.getReferenceId())
                .orElseThrow(() -> new RuntimeException("Order not found"));

        order.setStatus(Order.Status.PAID);
        orderRepo.save(order);
        
        // ✅ Clear the cart ONLY after successful payment
        Cart cart = cartRepo.findByUserId(order.getUser().getId()).orElse(null);
        if (cart != null) {
            cart.getItems().clear();
            cartRepo.save(cart);
        }
    }

    return paymentRepo.save(payment);
}

    
    private void sendAppointmentBookedEmail(Appointment appt) {

    SimpleMailMessage mail = new SimpleMailMessage();
    mail.setTo(appt.getUser().getEmail());
    mail.setSubject("Appointment Confirmed 🐾");

    mail.setText("""
        Hi %s,

        Your appointment for %s has been successfully booked 🎉

        🐶 Pet: %s
        👨‍⚕️ Vet: Dr. %s
        📅 Date: %s
        ⏰ Time: %s

        We look forward to taking care of your pet ❤️

        – Smart Pet Care
        """.formatted(
            appt.getUser().getName(),
            appt.getPet().getName(),
            appt.getPet().getName(),
            appt.getVet().getName(),
            appt.getSlot().getSlotDate(),
            appt.getSlot().getStartTime()
        ));

    mailSender.send(mail);
}

}
