package com.example.bangiay.repository;

import com.example.bangiay.entity.ChiTietHoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;

public interface ChiTietHoaDonRepository extends JpaRepository<ChiTietHoaDon, Long> {

    List<ChiTietHoaDon> findByHoaDon_Id(Long hoaDonId);

    @EntityGraph(attributePaths = {"sanPhamChiTiet", "sanPhamChiTiet.sanPham", "sanPhamChiTiet.sanPham.thuongHieu"})
    List<ChiTietHoaDon> findByHoaDon_IdIn(List<Long> hoaDonIds);

    List<ChiTietHoaDon> findBySanPhamChiTiet_Id(Long sanPhamChiTietId);
}
