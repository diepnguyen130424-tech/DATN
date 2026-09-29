package com.example.bangiay.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class DatHangRequest {
    private String hoTen;

    private String soDienThoai;

    private String diaChi;

    private String ghiChu;

    private String phuongThuc;

    private Long voucherId;
    private String maVoucher;
    private BigDecimal tienGiam;
}
