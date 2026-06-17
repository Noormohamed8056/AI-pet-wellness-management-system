package com.noor.petcare.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.noor.petcare.model.Product;
import com.noor.petcare.service.ProductService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/admin/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // CREATE product
@PostMapping(consumes = "multipart/form-data")
public ResponseEntity<?> create(
        @RequestParam String name,
        @RequestParam String description,
        @RequestParam Double price,
        @RequestParam Integer stock,
        @RequestPart(value = "image", required = false) MultipartFile image) {

    try {
        // Manual validation instead of framework crash
        if (image == null || image.isEmpty()) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body("Image file is required");
        }

        Product product = productService.createProduct(
                name, description, price, stock, image);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(product);

    } catch (Exception e) {
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage());
    }
}


    // DELETE (soft delete)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            return ResponseEntity.ok("Product deleted");

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    // DELETE ALL INACTIVE - Permanently remove inactive products without orders
    @DeleteMapping("/inactive/all")
    public ResponseEntity<?> deleteAllInactive() {
        try {
            ProductService.DeleteInactiveResult result = productService.deleteAllInactive();
            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage());
        }
    }

    // GET all products
    @GetMapping
    public ResponseEntity<?> getAll() {
        try {
            List<Product> products = productService.getAll();
            return ResponseEntity.ok(products);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(e.getMessage());
        }
    }

    // GET single product
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        try {
            Product product = productService.get(id);
            return ResponseEntity.ok(product);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }

    // UPDATE stock
    @PutMapping("/{id}/stock")
    public ResponseEntity<?> updateStock(
            @PathVariable Long id,
            @RequestParam Integer stock) {

        try {
            Product product = productService.updateStock(id, stock);
            return ResponseEntity.ok(product);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());
        }
    }

    // TOGGLE active
    @PutMapping("/{id}/toggle")
    public ResponseEntity<?> toggle(@PathVariable Long id) {
        try {
            Product product = productService.toggleActive(id);
            return ResponseEntity.ok(product);

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(e.getMessage());
        }
    }
    // ================= SHOP (USER) =================
@GetMapping("/shop")
public ResponseEntity<?> getActiveProductsForShop() {
    try {
        return ResponseEntity.ok(productService.getActiveProducts());
    } catch (Exception e) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(e.getMessage());
    }
}

}
