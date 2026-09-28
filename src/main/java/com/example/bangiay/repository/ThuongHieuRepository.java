package com.example.bangiay.repository;

import com.example.bangiay.entity.ThuongHieu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ThuongHieuRepository extends JpaRepository<ThuongHieu, Long> {

    Optional<ThuongHieu> findByTenThuongHieuIgnoreCase(String tenThuongHieu);
}
