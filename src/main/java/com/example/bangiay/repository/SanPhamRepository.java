package com.example.bangiay.repository;

import com.example.bangiay.entity.SanPham;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SanPhamRepository extends JpaRepository<SanPham, Long> {

    long countByDanhMuc_Id(Long danhMucId);

    long countByThuongHieu_Id(Long thuongHieuId);

    @Query("select s.danhMuc.id, count(s) from SanPham s " +
            "where s.danhMuc is not null group by s.danhMuc.id")
    List<Object[]> demSanPhamTheoDanhMuc();

    @Query("select s.thuongHieu.id, count(s) from SanPham s " +
            "where s.thuongHieu is not null group by s.thuongHieu.id")
    List<Object[]> demSanPhamTheoThuongHieu();
}
