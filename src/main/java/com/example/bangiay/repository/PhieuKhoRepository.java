package com.example.bangiay.repository;

import com.example.bangiay.entity.PhieuKho;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PhieuKhoRepository extends JpaRepository<PhieuKho, Long> {
    List<PhieuKho> findAllByOrderByNgayTaoDesc();
}
