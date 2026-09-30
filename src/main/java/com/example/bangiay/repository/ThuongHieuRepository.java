package com.example.bangiay.repository;

import com.example.bangiay.entity.ThuongHieu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface ThuongHieuRepository extends JpaRepository<ThuongHieu, Long> {

    Optional<ThuongHieu> findByTenThuongHieuIgnoreCase(String tenThuongHieu);

    /** Số lớn nhất trong các mã THxxx hiện có (0 nếu chưa có). */
    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(ma_thuong_hieu FROM 3) AS INTEGER)), 0) "
            + "FROM thuong_hieu WHERE ma_thuong_hieu ~ '^TH[0-9]+$'", nativeQuery = true)
    Integer maxSoMa();
}
