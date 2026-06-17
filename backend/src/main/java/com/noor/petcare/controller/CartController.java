package com.jeeva.petcare.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.jeeva.petcare.service.CartService;

@RestController
@RequestMapping("/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    // ================= ADD PRODUCT =================
    @PostMapping("/add")
    public ResponseEntity<?> add(
            @RequestParam Long userId,
            @RequestParam Long productId,
            @RequestParam Integer quantity) {               

        try {
            return ResponseEntity.ok(
                    cartService.addItem(userId, productId, quantity)
            );
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    // ================= UPDATE QUANTITY =================
    @PutMapping("/item/{itemId}")
    public ResponseEntity<?> updateQty(
            @PathVariable Long itemId,
            @RequestParam Long userId,
            @RequestParam Integer quantity) {

        try {
            return ResponseEntity.ok(
                    cartService.updateQuantity(userId, itemId, quantity)
            );
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    // ================= REMOVE ITEM =================
    @DeleteMapping("/item/{itemId}")
    public ResponseEntity<?> remove(
            @PathVariable Long itemId,
            @RequestParam Long userId) {

        try {
            return ResponseEntity.ok(
                    cartService.removeItem(userId, itemId)
            );
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    // ================= VIEW CART =================
    @GetMapping
    public ResponseEntity<?> view(@RequestParam Long userId) {

        try {
            return ResponseEntity.ok(
                    cartService.viewCart(userId)
            );
        } catch (RuntimeException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }
}
