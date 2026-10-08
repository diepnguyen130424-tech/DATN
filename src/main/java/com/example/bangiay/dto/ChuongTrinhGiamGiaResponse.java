package com.example.bangiay.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ChuongTrinhGiamGiaResponse {
    private Long id;
    private String tenChuongTrinh;
    private String loaiGiam;
    private BigDecimal giaTriGiam;
    private LocalDateTime ngayBatDau;
    private LocalDateTime ngayKetThuc;
    private String trangThai;

    // Thông tin thương hiệu áp dụng
    private Long thuongHieuId;
    private String tenThuongHieu;
}