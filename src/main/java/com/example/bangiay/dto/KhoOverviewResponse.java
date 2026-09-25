package com.example.bangiay.dto;

import java.util.List;

public record KhoOverviewResponse(
        int tongTon,
        int soSapHet,
        int soHetHang,
        int soSanPhamDangCo,
        List<TonKhoResponse> canNhapThem
) {}
