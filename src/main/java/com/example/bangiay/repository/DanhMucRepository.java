package com.example.bangiay.repository;

import com.example.bangiay.entity.DanhMuc;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface DanhMucRepository extends JpaRepository<DanhMuc, Long> {

    Optional<DanhMuc> findByTenDanhMucIgnoreCase(String tenDanhMuc);

    /** Số lớn nhất trong các mã DMxxx hiện có (0 nếu chưa có). */
    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(ma_danh_muc FROM 3) AS INTEGER)), 0) "
            + "FROM danh_muc WHERE ma_danh_muc ~ '^DM[0-9]+$'", nativeQuery = true)
    Integer maxSoMa();
}
