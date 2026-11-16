package com.example.bangiay.repository;

import com.example.bangiay.entity.ThongBao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ThongBaoRepository extends JpaRepository<ThongBao, Long> {

    // Khách: thông báo của mình + broadcast (khachHangId null)
    List<ThongBao> findByKhachHangIdOrKhachHangIdIsNullOrderByNgayTaoDesc(
            Long khachHangId
    );

    // Chống spam scheduler
    boolean existsByVoucherIdAndLoaiAndNgayTaoAfter(
            Long voucherId,
            String loai,
            LocalDateTime after
    );

    // Đếm thông báo chưa đọc cho badge
    long countByKhachHangIdAndDaDocIsFalse(Long khachHangId);
}