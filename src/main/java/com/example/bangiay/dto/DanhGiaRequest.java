package com.example.bangiay.dto;

import lombok.Data;

import java.util.List;

@Data
public class DanhGiaRequest {
    private Long chiTietHoaDonId;
    private Long khachHangId;
    private Integer soSao;
    private String noiDung;
    private List<String> hinhAnh;
}
