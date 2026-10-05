package com.example.bangiay.repository;

import com.example.bangiay.entity.YeuThich;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface YeuThichRepository
        extends JpaRepository<YeuThich, Long> {

    List<YeuThich>
    findAllByKhachHang_IdOrderByNgayTaoDesc(
            Long khachHangId
    );

    Optional<YeuThich>
    findByKhachHang_IdAndSanPham_Id(
            Long khachHangId,
            Long sanPhamId
    );

    boolean
    existsByKhachHang_IdAndSanPham_Id(
            Long khachHangId,
            Long sanPhamId
    );
    @Query("""
        SELECT y.sanPham.id
        FROM YeuThich y
        WHERE y.khachHang.id = :khachHangId
        ORDER BY y.ngayTao 
    """)
    List<Long> findSanPhamIdsByKhachHangId(
            @Param("khachHangId") Long khachHangId
    );
}