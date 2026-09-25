package com.example.bangiay.repository;

import com.example.bangiay.entity.TonKho;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TonKhoRepository extends JpaRepository<TonKho, Long> {
    Optional<TonKho> findByKho_IdAndSanPhamChiTiet_Id(Long khoId, Long sanPhamChiTietId);
    List<TonKho> findByKho_Id(Long khoId);
}
