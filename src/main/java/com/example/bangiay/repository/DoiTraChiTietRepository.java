package com.example.bangiay.repository;

import com.example.bangiay.entity.DoiTraChiTiet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoiTraChiTietRepository extends JpaRepository<DoiTraChiTiet, Long> {
    List<DoiTraChiTiet> findByChiTietHoaDon_Id(Long chiTietHoaDonId);
}
