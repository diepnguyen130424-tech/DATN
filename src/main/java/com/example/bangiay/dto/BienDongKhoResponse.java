package com.example.bangiay.dto;

import java.time.LocalDateTime;

public record BienDongKhoResponse(
        Long id,
        String loaiBienDong,
        String maPhieu,
        String maSku,
        String tenSanPham,
        String kichCo,
        String mauSac,
        Integer soLuongThayDoi,
        Integer tonTruoc,
        Integer tonSau,
        String lyDo,
        LocalDateTime ngayTao
) {}
