package com.example.bangiay.repository;

import com.example.bangiay.entity.DoiTraYeuCau;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DoiTraYeuCauRepository extends JpaRepository<DoiTraYeuCau, Long> {
    List<DoiTraYeuCau> findAllByOrderByNgayTaoDesc();
    boolean existsByHoaDon_IdAndTrangThaiNot(Long hoaDonId, String trangThai);
}
