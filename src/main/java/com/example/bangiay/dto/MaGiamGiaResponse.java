package com.example.bangiay.dto;

public class MaGiamGiaResponse {

    private Long id;
    private String maVoucher;
    private String tenVoucher;

    // Loại giảm: "PHAN_TRAM", "SO_TIEN", "FREESHIP"
    private String loaiGiam;

    // Số tiền giảm được tính ra (đã áp dụng giảm tối đa nếu có)
    private Double tienGiam = 0.0;

    // ⭐ Cờ tiện lợi cho FE, true nếu là voucher FREESHIP
    private Boolean freeship = false;

    // Thông báo hiển thị cho người dùng
    private String message;

    // ===== Getter / Setter =====

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMaVoucher() {
        return maVoucher;
    }

    public void setMaVoucher(String maVoucher) {
        this.maVoucher = maVoucher;
    }

    public String getTenVoucher() {
        return tenVoucher;
    }

    public void setTenVoucher(String tenVoucher) {
        this.tenVoucher = tenVoucher;
    }

    public String getLoaiGiam() {
        return loaiGiam;
    }

    public void setLoaiGiam(String loaiGiam) {
        this.loaiGiam = loaiGiam;
    }

    public Double getTienGiam() {
        return tienGiam;
    }

    public void setTienGiam(Double tienGiam) {
        this.tienGiam = tienGiam;
    }

    public Boolean getFreeship() {
        return freeship;
    }

    public void setFreeship(Boolean freeship) {
        this.freeship = freeship;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}