package com.example.bangiay.repository;

import com.example.bangiay.entity.GioHang;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GioHangRepository  extends JpaRepository<GioHang, Long> {

    Optional<GioHang> findByKhachHang_Id(Long khachHangId);
}
