package com.example.bangiay.dto;

import lombok.Data;

import java.util.List;

@Data
public class TaoHoaDonTaiQuayRequest {

    private String phuongThucThanhToan;   // TIEN_MAT | CHUYEN_KHOAN | MOMO
    private List<ChiTiet> chiTiet;

    @Data
    public static class ChiTiet {
        private Long sanPhamChiTietId;
        private Integer soLuong;
    }
}