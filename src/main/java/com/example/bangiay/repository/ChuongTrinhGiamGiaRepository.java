package com.example.bangiay.repository;

import com.example.bangiay.entity.ChuongTrinhGiamGia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ChuongTrinhGiamGiaRepository extends JpaRepository<ChuongTrinhGiamGia, Long> {

    List<ChuongTrinhGiamGia> findByTrangThai(String trangThai);
    // Lọc KM theo thương hiệu (dùng nếu cần)
    List<ChuongTrinhGiamGia> findByThuongHieuId(Long thuongHieuId);
}
