package com.example.bangiay.repository;

import com.example.bangiay.entity.LichSuHoaDon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LichSuHoaDonRepository extends JpaRepository<LichSuHoaDon, Long> {

    List<LichSuHoaDon> findByHoaDon_IdOrderByThoiGianDesc(Long hoaDonId);

    List<LichSuHoaDon> findByNhanVien_Id(Long nhanVienId);
}
