package com.example.bangiay.dto;

import java.math.BigDecimal;
import java.util.List;

public record KhoPhieuRequest(
        String maPhieu,
        String loaiPhieu,
        Long khoId,
        Long nhaCungCapId,
        Long nhanVienId,
        String lyDo,
        String ghiChu,
        List<ChiTietRequest> chiTiet
) {
    public record ChiTietRequest(
            Long sanPhamChiTietId,
            Integer soLuong,
            BigDecimal donGia
    ) {}
}
