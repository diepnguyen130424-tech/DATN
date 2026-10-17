package com.example.bangiay.repository;

import com.example.bangiay.entity.KhachHang;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.Optional;

public interface KhachHangRepository extends JpaRepository<KhachHang, Long> {

    Optional<KhachHang> findByTaiKhoan_Id(Long taiKhoanId);

    // Tra cứu khách đã đăng ký theo SĐT (thử nhiều dạng: 0xxx / +84xxx / 84xxx)
    Optional<KhachHang> findFirstBySoDienThoaiIn(Collection<String> soDienThoai);
}

