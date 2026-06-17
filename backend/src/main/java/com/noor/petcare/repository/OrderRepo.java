package com.noor.petcare.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.noor.petcare.model.Order;

public interface OrderRepo extends JpaRepository<Order, Long> {
    List<Order> findByUserId(Long userId);
    
}
