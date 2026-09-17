package com.example.bangiay.repository;

import com.example.bangiay.entity.DiaChi;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiaChiRepository extends JpaRepository<DiaChi, Long> {

    List<DiaChi> findByKhachHang_Id(Long khachHangId);
}
