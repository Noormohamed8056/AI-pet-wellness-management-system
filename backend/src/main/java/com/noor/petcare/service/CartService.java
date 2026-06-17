package com.jeeva.petcare.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.jeeva.petcare.model.*;
import com.jeeva.petcare.repository.*;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepo cartRepo;
    private final CartItemRepo cartItemRepo;
    private final ProductRepo productRepo;
    private final UserRepo userRepo;

    // ================= GET OR CREATE CART =================
    private Cart getCart(Long userId) {

        return cartRepo.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepo.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found"));

                    Cart cart = new Cart();
                    cart.setUser(user);
                    return cartRepo.save(cart);
                });
    }

    // ================= ADD ITEM =================
    public Cart addItem(Long userId, Long productId, Integer qty) {

        if (qty <= 0) {
            throw new RuntimeException("Quantity must be greater than zero");
        }

        Cart cart = getCart(userId);

        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        if (!product.isActive()) {
            throw new RuntimeException("Product is not available");
        }

        if (product.getStock() < qty) {
            throw new RuntimeException("Insufficient stock");
        }

        CartItem item = cartItemRepo
                .findByCartIdAndProductId(cart.getId(), productId)
                .orElse(null);

        if (item == null) {
            item = new CartItem();
            item.setCart(cart);
            item.setProduct(product);
            item.setQuantity(qty);
            item.setPrice(product.getPrice());
            cart.getItems().add(item);
        } else {
            item.setQuantity(item.getQuantity() + qty);
        }

        return cartRepo.save(cart);
    }

    // ================= UPDATE QUANTITY =================
    public Cart updateQuantity(Long userId, Long itemId, Integer qty) {

        Cart cart = getCart(userId);

        CartItem item = cartItemRepo.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        // 🔐 SECURITY CHECK
        if (!item.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Unauthorized cart access");
        }

        if (qty <= 0) {
            cart.getItems().remove(item);
            cartItemRepo.delete(item);
        } else {
            item.setQuantity(qty);
        }

        return cartRepo.save(cart);
    }

    // ================= REMOVE ITEM =================
    public Cart removeItem(Long userId, Long itemId) {

        Cart cart = getCart(userId);

        CartItem item = cartItemRepo.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found"));

        // 🔐 SECURITY CHECK
        if (!item.getCart().getId().equals(cart.getId())) {
            throw new RuntimeException("Unauthorized cart access");
        }

        cart.getItems().remove(item);
        cartItemRepo.delete(item);

        return cartRepo.save(cart);
    }

    // ================= VIEW CART =================
    public Cart viewCart(Long userId) {
        return getCart(userId);
    }
}
