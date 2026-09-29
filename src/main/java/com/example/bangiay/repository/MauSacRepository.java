package com.example.bangiay.repository;

import com.example.bangiay.entity.MauSac;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MauSacRepository extends JpaRepository<MauSac, Long> {
    boolean existsByTenMau(String tenMau);
    boolean existsByTenMauAndIdNot(String tenMau, Long id);
}
