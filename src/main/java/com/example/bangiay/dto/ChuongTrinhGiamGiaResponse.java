package com.example.bangiay.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ChuongTrinhGiamGiaResponse {
    private Long id;
    private String tenChuongTrinh;
    private String loaiGiam;
    private BigDecimal giaTriGiam;
    private LocalDateTime ngayBatDau;
    private LocalDateTime ngayKetThuc;
    private String trangThai;
    private String phamViApDung;

    private Long thuongHieuId;
    private String tenThuongHieu;

    private List<ItemApDung> sanPhams;    // phạm vi SAN_PHAM
    private List<ItemApDung> bienThes;    // phạm vi BIEN_THE

    @Data
    public static class ItemApDung {
        private Long id;                 // id của bản ghi con (spgg hoặc btgg)
        private Long sanPhamId;
        private String tenSanPham;
        private Long sanPhamChiTietId;   // null nếu là SAN_PHAM
        private String tenKichCo;
        private String tenMau;
        private String maSku;
    }
}