package com.example.bangiay.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HoaDonResponse {

    private Long id;
    private String maHoaDon;
    private String loaiHoaDon;
    private String trangThai;
    private Double tongThanhToan;
    private String phuongThucThanhToan;
    private LocalDateTime ngayLap;
    private LocalDateTime ngayCapNhat;
    private String ghiChu;

    private List<ChiTietResponse> chiTiet;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChiTietResponse {
        private Long id;
        private Long sanPhamChiTietId;
        private Integer soLuong;
        private Double donGia;
        private Double thanhTien;
    }
}