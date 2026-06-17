package com.jeeva.petcare.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.jeeva.petcare.model.Cart;

public interface CartRepo extends JpaRepository<Cart, Long> {
    Optional<Cart> findByUserId(Long userId);
}
