package com.example.bangiay.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private Long id;
    private String tenDangNhap;
    private String vaiTro;
    private String trangThai;
    private Long khachHangId;
}
