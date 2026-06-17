package com.jeeva.petcare.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.jeeva.petcare.model.CartItem;

public interface CartItemRepo extends JpaRepository<CartItem, Long> {
    Optional<CartItem> findByCartIdAndProductId(Long cartId, Long productId);
}
