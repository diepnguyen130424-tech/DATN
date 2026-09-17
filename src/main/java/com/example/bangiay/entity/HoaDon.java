package com.example.bangiay.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "hoa_don")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoaDon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ma_hoa_don", nullable = false, unique = true)
    private String maHoaDon;

    @ManyToOne
    @JoinColumn(name = "khach_hang_id")
    private KhachHang khachHang;

    @ManyToOne
    @JoinColumn(name = "nhan_vien_id")
    private NhanVien nhanVien;

    @ManyToOne
    @JoinColumn(name = "dia_chi_id")
    private DiaChi diaChi;

    @ManyToOne
    @JoinColumn(name = "voucher_id")
    private MaGiamGia voucher;

    @Column(name = "loai_hoa_don", nullable = false)
    private String loaiHoaDon;

    @Column(name = "ngay_lap")
    private LocalDateTime ngayLap;

    @Column(name = "tong_tien_hang", nullable = false, precision = 15, scale = 2)
    private BigDecimal tongTienHang;

    @Column(name = "tien_giam", precision = 15, scale = 2)
    private BigDecimal tienGiam;

    @Column(name = "phi_van_chuyen", precision = 15, scale = 2)
    private BigDecimal phiVanChuyen;

    @Column(name = "tong_thanh_toan", nullable = false, precision = 15, scale = 2)
    private BigDecimal tongThanhToan;

    @Column(name = "trang_thai", nullable = false)
    private String trangThai;

    @Column(name = "ghi_chu", columnDefinition = "TEXT")
    private String ghiChu;

    @Column(name = "ngay_cap_nhat")
    private LocalDateTime ngayCapNhat;
}