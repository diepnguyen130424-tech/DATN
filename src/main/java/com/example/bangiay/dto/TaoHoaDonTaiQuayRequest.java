package com.example.bangiay.dto;

import lombok.Data;

import java.util.List;

@Data
public class TaoHoaDonTaiQuayRequest {

    private String phuongThucThanhToan;   // TIEN_MAT | CHUYEN_KHOAN | MOMO
    private String tenKhach;              // Tên người mua (không bắt buộc)
    private String soDienThoaiKhach;      // SĐT người mua (không bắt buộc)
    private List<ChiTiet> chiTiet;

    // Người thao tác (nhân viên đang bán tại quầy) — để ghi vào hóa đơn & lịch sử
    private Long taiKhoanId;
    private Long nhanVienId;

    @Data
    public static class ChiTiet {
        private Long sanPhamChiTietId;
        private Integer soLuong;
    }
}