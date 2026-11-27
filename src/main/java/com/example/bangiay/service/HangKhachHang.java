package com.example.bangiay.service;

import java.math.BigDecimal;

/**
 * Hạng khách hàng theo TỔNG CHI TIÊU (các đơn đã giao / đã thanh toán).
 * Muốn đổi mốc chi tiêu thì chỉ cần sửa các con số ở đây (VNĐ).
 */
public enum HangKhachHang {

    THANH_VIEN("Thành viên", 0L),
    BAC("Bạc", 2_000_000L),
    VANG("Vàng", 5_000_000L),
    KIM_CUONG("Kim cương", 10_000_000L);

    private final String ten;
    private final BigDecimal nguong;

    HangKhachHang(String ten, long nguong) {
        this.ten = ten;
        this.nguong = BigDecimal.valueOf(nguong);
    }

    public String getTen() {
        return ten;
    }

    /** Chi tiêu tối thiểu để đạt hạng này. */
    public BigDecimal getNguong() {
        return nguong;
    }

    /** Hạng cao nhất mà mức chi tiêu này đạt được. */
    public static HangKhachHang tuChiTieu(BigDecimal chiTieu) {
        HangKhachHang ketQua = THANH_VIEN;
        if (chiTieu == null) return ketQua;
        for (HangKhachHang h : values()) {
            if (chiTieu.compareTo(h.nguong) >= 0) ketQua = h;
        }
        return ketQua;
    }

    /** Chuyển mã (VD "VANG") thành hạng; rỗng hoặc sai mã thì trả về null. */
    public static HangKhachHang tuMa(String ma) {
        if (ma == null || ma.trim().isEmpty()) return null;
        try {
            return valueOf(ma.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /** Hạng kế tiếp, null nếu đã là hạng cao nhất. */
    public HangKhachHang hangTiepTheo() {
        int i = ordinal() + 1;
        return i < values().length ? values()[i] : null;
    }

    /** Hạng hiện tại có đạt (bằng hoặc cao hơn) hạng yêu cầu không. */
    public boolean datTu(HangKhachHang yeuCau) {
        return ordinal() >= yeuCau.ordinal();
    }
}