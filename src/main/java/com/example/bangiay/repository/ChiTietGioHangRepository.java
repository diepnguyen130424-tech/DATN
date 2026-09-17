package com.example.bangiay.repository;

import com.example.bangiay.entity.ChiTietGioHang;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChiTietGioHangRepository extends JpaRepository<ChiTietGioHang, Long> {

    List<ChiTietGioHang> findByGioHang_Id(Long gioHangId);

    Optional<ChiTietGioHang> findByGioHang_IdAndSanPhamChiTiet_Id(
            Long gioHangId,
            Long sanPhamChiTietId
    );
}
