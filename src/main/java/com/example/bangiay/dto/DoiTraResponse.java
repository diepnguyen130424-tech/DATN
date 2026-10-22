package com.example.bangiay.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DoiTraResponse {
    private Long id;
    private String maYeuCau;
    private Long hoaDonId;
    private String maHoaDon;
    private String tenKhach;
    private String loaiYeuCau;
    private String lyDo;
    private String moTa;
    private String phuongThucHoanTien;
    private String thongTinHoanTien;
    private String anhMinhChung;
    private String trangThai;
    private LocalDateTime ngayTao;
    private List<SanPhamTraResponse> sanPhamTra;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class SanPhamTraResponse {
        private Long chiTietHoaDonId;
        private Long sanPhamChiTietId;
        private Integer soLuong;
    }
}
