package com.example.bangiay.repository;

import com.example.bangiay.entity.NhanVien;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NhanVienRepository extends JpaRepository<NhanVien, Long> {

    Optional<NhanVien> findByTaiKhoan_Id(Long taiKhoanId);
}
