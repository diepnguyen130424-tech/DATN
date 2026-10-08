package com.example.bangiay.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ChuongTrinhGiamGiaRequest {
    private String tenChuongTrinh;
    private String loaiGiam;
    private BigDecimal giaTriGiam;
    private LocalDateTime ngayBatDau;
    private LocalDateTime ngayKetThuc;
    private String trangThai;
    private Long thuongHieuId;   // null = áp dụng tất cả SP
}