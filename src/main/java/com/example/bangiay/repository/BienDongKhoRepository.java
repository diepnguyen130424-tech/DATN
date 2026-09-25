package com.example.bangiay.repository;

import com.example.bangiay.entity.BienDongKho;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BienDongKhoRepository extends JpaRepository<BienDongKho, Long> {
    List<BienDongKho> findTop200ByOrderByNgayTaoDesc();
}
