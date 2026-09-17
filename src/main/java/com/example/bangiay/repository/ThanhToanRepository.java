package com.example.bangiay.repository;

import com.example.bangiay.entity.ThanhToan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ThanhToanRepository extends JpaRepository<ThanhToan, Long> {

    Optional<ThanhToan> findByHoaDon_Id(Long hoaDonId);
}
