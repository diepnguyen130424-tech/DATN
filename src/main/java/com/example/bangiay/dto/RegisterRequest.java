package com.example.bangiay.dto;

import lombok.Data;

@Data
public class RegisterRequest {

    private String tenDangNhap;

    private String matKhau;

    private String hoTen;

    private String soDienThoai;

    private String ngaySinh;

    private String gioiTinh;
}