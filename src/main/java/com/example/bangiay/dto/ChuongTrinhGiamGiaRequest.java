package com.example.bangiay.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ChuongTrinhGiamGiaRequest {
    private String tenChuongTrinh;
    private String loaiGiam;
    private BigDecimal giaTriGiam;
    private LocalDateTime ngayBatDau;
    private LocalDateTime ngayKetThuc;
    private String trangThai;

    private String phamViApDung;      // TAT_CA | THUONG_HIEU | SAN_PHAM | BIEN_THE
    private Long thuongHieuId;         // dùng khi THUONG_HIEU
    private List<Long> sanPhamIds;     // dùng khi SAN_PHAM
    private List<Long> bienTheIds;     // dùng khi BIEN_THE (id của san_pham_chi_tiet)
}