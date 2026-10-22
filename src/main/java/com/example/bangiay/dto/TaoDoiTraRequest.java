package com.example.bangiay.dto;

import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TaoDoiTraRequest {
    private Long hoaDonId;
    private String loaiYeuCau;
    private String lyDo;
    private String moTa;
    private String phuongThucHoanTien;
    private String thongTinHoanTien;
    private List<AnhMinhChungRequest> anhMinhChung;
    private List<SanPhamTraRequest> sanPhamTra;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class SanPhamTraRequest {
        private Long chiTietHoaDonId;
        private Long sanPhamChiTietId;
        private Integer soLuong;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor
    public static class AnhMinhChungRequest {
        private String tenFile;
        private String dataUrl;
    }
}
