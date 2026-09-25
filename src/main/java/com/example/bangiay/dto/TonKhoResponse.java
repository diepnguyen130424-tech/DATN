package com.example.bangiay.dto;

public record TonKhoResponse(
        Long id,
        Long khoId,
        String maKho,
        Long sanPhamChiTietId,
        String maSku,
        Long sanPhamId,
        String tenSanPham,
        String kichCo,
        String mauSac,
        String hinhAnh,
        Integer soLuongTon,
        Integer soLuongDat,
        Integer soLuongKhaDung,
        Integer mucTonToiThieu,
        Integer mucTonToiDa,
        String trangThai
) {}
