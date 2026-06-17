package com.jeeva.petcare.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.jeeva.petcare.model.OrderItem;

public interface OrderItemRepo extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);
    boolean existsByProductId(Long productId);
}
