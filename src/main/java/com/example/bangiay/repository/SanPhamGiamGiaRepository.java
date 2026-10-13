package com.example.bangiay.repository;

import com.example.bangiay.entity.SanPhamGiamGia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SanPhamGiamGiaRepository extends JpaRepository<SanPhamGiamGia, Long> {

    List<SanPhamGiamGia> findByChuongTrinhGiamGia_Id(Long ctggId);

    List<SanPhamGiamGia> findBySanPham_Id(Long sanPhamId);

    // ⭐ THÊM MỚI — dùng khi update/delete chương trình
    @Modifying
    @Query("DELETE FROM SanPhamGiamGia s WHERE s.chuongTrinhGiamGia.id = :ctggId")
    void deleteByChuongTrinhGiamGiaId(@Param("ctggId") Long ctggId);
}