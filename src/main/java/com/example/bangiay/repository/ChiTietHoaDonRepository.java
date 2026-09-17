package com.example.bangiay.repository;

import com.example.bangiay.entity.ChiTietHoaDon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChiTietHoaDonRepository extends JpaRepository<ChiTietHoaDon, Long> {

    List<ChiTietHoaDon> findByHoaDon_Id(Long hoaDonId);

    List<ChiTietHoaDon> findBySanPhamChiTiet_Id(Long sanPhamChiTietId);
}
