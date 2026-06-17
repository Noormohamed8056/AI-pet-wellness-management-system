package com.noor.petcare.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.noor.petcare.model.*;
import com.noor.petcare.repository.*;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepo orderRepo;
    private final OrderItemRepo orderItemRepo;
    private final CartRepo cartRepo;
    private final PaymentService paymentService;

// ================= PLACE ORDER =================
    @Transactional
public Order placeOrder(Long userId) {

    Cart cart = cartRepo.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Cart not found"));

    if (cart.getItems().isEmpty()) {
        throw new RuntimeException("Cart is empty");
    }

    Order order = new Order();
    order.setUser(cart.getUser());
    order.setStatus(Order.Status.CREATED);

    Order savedOrder = orderRepo.save(order);

    double total = 0;

    for (CartItem ci : cart.getItems()) {
        OrderItem oi = new OrderItem();
        oi.setOrder(savedOrder);
        oi.setProduct(ci.getProduct());
        oi.setQuantity(ci.getQuantity());
        oi.setPrice(ci.getPrice());

        total += ci.getPrice() * ci.getQuantity();

        orderItemRepo.save(oi);
        savedOrder.getItems().add(oi);
    }

    savedOrder.setTotalAmount(total);
    orderRepo.save(savedOrder);

    // ✅ DO NOT clear cart here - wait for successful payment
    // Cart will be cleared in PaymentService.markSuccess() after payment is verified

    return savedOrder;
}


    // ================= USER ORDERS =================
    public List<Order> getUserOrders(Long userId) {
        return orderRepo.findByUserId(userId);
    }

    // ================= ORDER DETAILS =================
    public Order getOrder(Long orderId) {
        return orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
    }
    @Transactional
public Order cancelOrder(Long orderId, Long userId) {

    Order order = orderRepo.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));

    if (!order.getUser().getId().equals(userId)) {
        throw new RuntimeException("Unauthorized");
    }

    if (order.getStatus() == Order.Status.SHIPPED ||
        order.getStatus() == Order.Status.DELIVERED) {
        throw new RuntimeException("Order cannot be cancelled now");
    }

       // 🔁 Dummy refund
    paymentService.refundOrderPayment(order.getId());

    order.setStatus(Order.Status.CANCELLED);
    return orderRepo.save(order);
}
// ================= ALL ORDERS (ADMIN) =================
public List<Order> getAllOrders() {
    return orderRepo.findAll();
}
@Transactional
public Order updateOrderStatus(Long orderId, Order.Status newStatus) {

    Order order = orderRepo.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Order not found"));

    // ❌ Prevent invalid updates
    if (order.getStatus() == Order.Status.CANCELLED) {
        throw new RuntimeException("Cancelled order cannot be updated");
    }

    if (order.getStatus() == Order.Status.DELIVERED) {
        throw new RuntimeException("Delivered order cannot be updated");
    }

    order.setStatus(newStatus);

    return orderRepo.save(order);
}


}
