package com.noor.petcare.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.noor.petcare.model.Product;

public interface ProductRepo extends JpaRepository<Product, Long> {
     List<Product> findByActiveTrue();
     List<Product> findByActiveFalse();
}
