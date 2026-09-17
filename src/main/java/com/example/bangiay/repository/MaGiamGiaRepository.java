package com.example.bangiay.repository;

import com.example.bangiay.entity.MaGiamGia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MaGiamGiaRepository extends JpaRepository<MaGiamGia, Long> {

    Optional<MaGiamGia> findByMaVoucher(String maVoucher);

    boolean existsByMaVoucher(String maVoucher);
}