package com.example.bangiay.repository;

import com.example.bangiay.entity.KhachHang;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface KhachHangRepository extends JpaRepository<KhachHang, Long> {

    Optional<KhachHang> findByTaiKhoan_Id(Long taiKhoanId);
}

