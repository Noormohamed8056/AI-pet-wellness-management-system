package com.noor.petcare.service;

import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.noor.petcare.model.Product;
import com.noor.petcare.repository.OrderItemRepo;
import com.noor.petcare.repository.ProductRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepo productRepo;
    private final OrderItemRepo orderItemRepo;

    private final String UPLOAD_DIR = "uploads";

    // CREATE product
    public Product createProduct(
            String name,
            String description,
            Double price,
            Integer stock,
            MultipartFile image) {

        try {
            // Ensure uploads folder exists
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Create unique file name
            String fileName = System.currentTimeMillis() + "_" + image.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);

            // Save image to disk
            Files.write(filePath, image.getBytes());

            // Save product data
            Product p = new Product();
            p.setName(name);
            p.setDescription(description);
            p.setPrice(price);
            p.setStock(stock);
            p.setImageUrl("/uploads/" + fileName);
            p.setActive(true);

            return productRepo.save(p);

        } catch (IOException e) {
            throw new RuntimeException("Image upload failed");
        }
    }

    // SOFT DELETE
    public void deleteProduct(Long id) {
        Product p = get(id);
        p.setActive(false);
        productRepo.save(p);
    }

    public DeleteInactiveResult deleteAllInactive() {
        List<Product> inactiveProducts = productRepo.findByActiveFalse();
        List<Product> deletable = new ArrayList<>();
        int skipped = 0;

        for (Product product : inactiveProducts) {
            if (orderItemRepo.existsByProductId(product.getId())) {
                skipped++;
                continue;
            }
            deletable.add(product);
        }

        productRepo.deleteAll(deletable);
        return new DeleteInactiveResult(deletable.size(), skipped);
    }

    public record DeleteInactiveResult(int deleted, int skipped) {}

    // GET all products
    public List<Product> getAll() {
        return productRepo.findAll();
    }

    // GET one product
    public Product get(Long id) {
        return productRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
    }

    // UPDATE stock
    public Product updateStock(Long id, Integer stock) {
        Product p = get(id);
        p.setStock(stock);
        return productRepo.save(p);
    }

    // ================= SHOP (USER) =================
    public List<Product> getActiveProducts() {
        return productRepo.findByActiveTrue();
    }

    // ENABLE / DISABLE
    public Product toggleActive(Long id) {
        Product p = get(id);
        p.setActive(!p.isActive());
        return productRepo.save(p);
    }
}
