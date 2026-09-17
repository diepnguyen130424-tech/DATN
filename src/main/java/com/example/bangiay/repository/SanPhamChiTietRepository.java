package com.example.bangiay.repository;

import com.example.bangiay.entity.SanPhamChiTiet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SanPhamChiTietRepository extends JpaRepository<SanPhamChiTiet, Long> {

    List<SanPhamChiTiet> findBySanPham_Id(Long sanPhamId);

    List<SanPhamChiTiet> findByKichCo_Id(Long kichCoId);

    List<SanPhamChiTiet> findByMauSac_Id(Long mauSacId);

    Optional<SanPhamChiTiet> findByMaSku(String maSku);

    boolean existsByMaSku(String maSku);
}
