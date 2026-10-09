package com.example.bangiay.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DanhGiaResponse {
    private Long id;
    private Long sanPhamId;
    private Long chiTietHoaDonId;
    /** Tên khách đã che bớt, ví dụ "N*****n" */
    private String tenKhachHang;
    private Integer soSao;
    private String noiDung;
    private List<String> hinhAnh;
    /** Ví dụ: "Size 42 · Màu Đen" */
    private String phanLoai;
    private String phanHoi;
    private LocalDateTime ngayPhanHoi;
    private LocalDateTime ngayTao;
}
