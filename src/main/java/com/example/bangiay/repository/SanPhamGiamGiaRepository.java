package com.example.bangiay.repository;

import com.example.bangiay.entity.SanPhamGiamGia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SanPhamGiamGiaRepository extends JpaRepository<SanPhamGiamGia, Long> {

    List<SanPhamGiamGia> findBySanPham_Id(Long sanPhamId);

    List<SanPhamGiamGia> findByChuongTrinhGiamGia_Id(Long chuongTrinhGiamGiaId);
}
