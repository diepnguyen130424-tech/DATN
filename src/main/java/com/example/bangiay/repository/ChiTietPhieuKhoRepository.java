package com.example.bangiay.repository;

import com.example.bangiay.entity.ChiTietPhieuKho;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChiTietPhieuKhoRepository extends JpaRepository<ChiTietPhieuKho, Long> {
    List<ChiTietPhieuKho> findByPhieuKho_Id(Long phieuKhoId);
}
