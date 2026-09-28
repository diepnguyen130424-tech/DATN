package com.example.bangiay.repository;

import com.example.bangiay.entity.DanhMuc;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DanhMucRepository extends JpaRepository<DanhMuc, Long> {

    Optional<DanhMuc> findByTenDanhMucIgnoreCase(String tenDanhMuc);
}
