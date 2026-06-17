package com.noor.petcare.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import com.noor.petcare.model.Order;
import com.noor.petcare.service.OrderService;
import com.razorpay.RazorpayException;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // PLACE ORDER
    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestParam Long userId) throws RazorpayException {
        try {
            return ResponseEntity.ok(orderService.placeOrder(userId));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    // USER ORDERS
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> userOrders(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(orderService.getUserOrders(userId));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    // ORDER DETAILS
    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrder(@PathVariable Long orderId) {
        try {
            return ResponseEntity.ok(orderService.getOrder(orderId));
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }
    @PutMapping("/{orderId}/cancel")
public ResponseEntity<?> cancel(
        @PathVariable Long orderId,
        @RequestParam Long userId) {

    try {
        return ResponseEntity.ok(
                orderService.cancelOrder(orderId, userId));
    } catch (RuntimeException e) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage());
    }
}
// ================= ADMIN - VIEW ALL ORDERS =================
@GetMapping("/admin/all")
public ResponseEntity<?> getAllOrders() {
    try {
        return ResponseEntity.ok(orderService.getAllOrders());
    } catch (Exception e) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(e.getMessage());
    }
}
// ================= ADMIN - UPDATE ORDER STATUS =================
@PutMapping("/admin/{orderId}/status")
public ResponseEntity<?> updateStatus(
        @PathVariable Long orderId,
        @RequestParam Order.Status status) {

    try {
        return ResponseEntity.ok(
                orderService.updateOrderStatus(orderId, status)
        );
    } catch (RuntimeException e) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage());
    }
}


}
