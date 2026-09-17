package com.example.bangiay.repository;

import com.example.bangiay.entity.HoaDon;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HoaDonRepository extends JpaRepository<HoaDon, Long> {

    Optional<HoaDon> findByMaHoaDon(String maHoaDon);

    boolean existsByMaHoaDon(String maHoaDon);

    List<HoaDon> findByKhachHang_Id(Long khachHangId);

    List<HoaDon> findByNhanVien_Id(Long nhanVienId);

    List<HoaDon> findByTrangThai(String trangThai);

    List<HoaDon> findByLoaiHoaDon(String loaiHoaDon);
}