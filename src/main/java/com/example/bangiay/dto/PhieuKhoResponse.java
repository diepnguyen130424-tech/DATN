package com.example.bangiay.dto;

import java.time.LocalDateTime;
import java.util.List;

public record PhieuKhoResponse(
        Long id,
        String maPhieu,
        String loaiPhieu,
        String kho,
        String nhaCungCap,
        String nhanVien,
        String lyDo,
        String ghiChu,
        String trangThai,
        LocalDateTime ngayTao,
        List<ChiTietResponse> chiTiet
) {
    public record ChiTietResponse(
            Long id,
            Long sanPhamChiTietId,
            String maSku,
            String tenSanPham,
            String kichCo,
            String mauSac,
            Integer soLuong
    ) {}
}
