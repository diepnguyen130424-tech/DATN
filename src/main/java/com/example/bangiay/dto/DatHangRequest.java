package com.example.bangiay.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

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
    private Double phiVanChuyen;

    private Long voucherFreeshipId;
    private String maVoucherFreeship;

    // Danh sách ID chi tiết giỏ hàng được chọn để đặt hàng
    private List<Long> chiTietGioHangIds;
}
