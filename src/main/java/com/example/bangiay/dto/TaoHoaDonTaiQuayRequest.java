
package com.example.bangiay.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class TaoHoaDonTaiQuayRequest {

    // TIEN_MAT | CHUYEN_KHOAN | MOMO | KET_HOP
    private String phuongThucThanhToan;

    // Số tiền thanh toán bằng tiền mặt
    private BigDecimal soTienMat;

    // Số tiền thanh toán bằng chuyển khoản
    private BigDecimal soTienChuyenKhoan;

    private String tenKhach;
    private String soDienThoaiKhach;

    private List<ChiTiet> chiTiet;

    // Người thao tác
    private Long taiKhoanId;
    private Long nhanVienId;

    @Data
    public static class ChiTiet {
        private Long sanPhamChiTietId;
        private Integer soLuong;
    }
}
