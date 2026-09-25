package com.example.bangiay.repository;

import com.example.bangiay.entity.Kho;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface KhoRepository extends JpaRepository<Kho, Long> {
    Optional<Kho> findByMaKho(String maKho);
}
